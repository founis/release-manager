"""Build the PHP that publishes validated hubs and 301s their merge sources.
usage: python3 -I gen_deploy.py <out.php> <wp_id> [<wp_id> ...]"""
import json, os, sys, base64
S = os.environ['S']; P = f'{S}/p2'
out, ids = sys.argv[1], sys.argv[2:]
items = []
for i in ids:
    m = json.load(open(f'{P}/out/{i}.json', encoding='utf-8'))
    items.append({'id': int(i), 'content': open(f'{P}/out/{i}.html', encoding='utf-8').read().strip(),
                  'desc': m['meta_description'].strip(), 'excerpt': (m.get('excerpt') or m['meta_description']).strip(),
                  'faq': m.get('faq') or [], 'merged_from': [int(x) for x in (m.get('merged_from') or [])]})
php = r'''
global $wpdb; $items = json_decode(base64_decode('ITEMS'), true); $res = []; $today = current_time('Y-m-d');
$map_add = [];
foreach ($items as $it) {
  $id = $it['id']; $p = get_post($id); if (!$p || $p->post_type !== 'post') { $res[$id] = 'missing'; continue; }
  if (!get_post_meta($id, '_cg_backup_content_20261109_p2', true)) {
    add_post_meta($id, '_cg_backup_content_20261109_p2', wp_slash(wp_json_encode(['content' => $p->post_content, 'excerpt' => $p->post_excerpt, 'desc' => get_post_meta($id, '_yoast_wpseo_metadesc', true), 'faq' => get_post_meta($id, '_cg_faq_jsonld', true), 'modified' => $p->post_modified], JSON_UNESCAPED_UNICODE)));
  }
  $r = wp_update_post(wp_slash(['ID' => $id, 'post_content' => $it['content'], 'post_excerpt' => $it['excerpt']]), true);
  if (is_wp_error($r)) { $res[$id] = 'ERR ' . $r->get_error_message(); continue; }
  update_post_meta($id, '_yoast_wpseo_metadesc', $it['desc']);
  update_post_meta($id, '_cg_updated', $today);
  if ($it['faq']) {
    $ld = ['@context' => 'https://schema.org', '@type' => 'FAQPage', '@id' => get_permalink($id) . '#faq', 'mainEntity' => []];
    foreach ($it['faq'] as $f) $ld['mainEntity'][] = ['@type' => 'Question', 'name' => $f['q'], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['a']]];
    update_post_meta($id, '_cg_faq_jsonld', wp_slash(wp_json_encode($ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));
  } else delete_post_meta($id, '_cg_faq_jsonld');
  $saved = get_post_field('post_content', $id);
  $res[$id] = ['saved_len' => strlen($saved), 'sent_len' => strlen($it['content']), 'same' => trim($saved) === trim($it['content']), 'merged' => $it['merged_from']];
  foreach ($it['merged_from'] as $src) { if ($src !== $id) { $map_add[$src] = $id; update_post_meta($src, '_yoast_wpseo_meta-robots-noindex', '1'); } }
  if (function_exists('rocket_clean_post')) rocket_clean_post($id);
}
if ($map_add) {
  $code = $wpdb->get_var("SELECT code FROM {$wpdb->prefix}snippets WHERE id=18");
  $pairs = []; foreach ($map_add as $s => $t) if (!preg_match('/\b' . $s . '=>/', $code)) $pairs[] = $s . '=>' . $t;
  if ($pairs) {
    if (!get_option('cg_backup_snippet18_20261109b')) update_option('cg_backup_snippet18_20261109b', $code, false);
    $new = str_replace("\t);\n\t\$id=", "\t\t/* 9/11 audit merges (BATCH) */\n\t\t" . implode(',', $pairs) . ",\n\t);\n\t\$id=", $code);
    if ($new !== $code) { $wpdb->update($wpdb->prefix . 'snippets', ['code' => $new, 'modified' => current_time('mysql', 1)], ['id' => 18]); if (function_exists('\Code_Snippets\clean_snippets_cache')) \Code_Snippets\clean_snippets_cache($wpdb->prefix . 'snippets'); $res['_s18'] = $pairs; }
    else $res['_s18'] = 'anchor not found';
  }
  foreach (array_keys($map_add) as $src) {
    clean_post_cache($src);
    try { $repo = YoastSEO()->classes->get(\Yoast\WP\SEO\Repositories\Indexable_Repository::class); $b = YoastSEO()->classes->get(\Yoast\WP\SEO\Builders\Indexable_Builder::class); $b->build_for_id_and_type($src, 'post', $repo->find_by_id_and_type($src, 'post', false) ?: false); } catch (\Throwable $e) {}
    if (function_exists('rocket_clean_post')) rocket_clean_post($src);
  }
}
return $res;
'''.replace('ITEMS', base64.b64encode(json.dumps(items, ensure_ascii=False).encode()).decode()).replace('BATCH', '-'.join(ids))
open(out, 'w').write(php)
print('ok', out, [(x['id'], len(x['content']), x['merged_from']) for x in items])
