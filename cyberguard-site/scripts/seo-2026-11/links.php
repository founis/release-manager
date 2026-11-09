// Replace internal links that point at redirected URLs (snippet 18 map + Redirection plugin) with the final URL, in all live posts.
// post_modified is kept (link fixes are not a content update). Backup: meta _cg_backup_content_20261109_links.
global $wpdb; $APPLY = APPLYFLAG; $res = ['changed' => [], 'pairs' => []];
$code = $wpdb->get_var("SELECT code FROM {$wpdb->prefix}snippets WHERE id=18");
preg_match_all('/(\d+)=>(\d+)/', $code, $mm, PREG_SET_ORDER); $map = []; foreach ($mm as $m) $map[(int)$m[1]] = (int)$m[2];
$red = []; foreach ($wpdb->get_results("SELECT url, action_data FROM {$wpdb->prefix}redirection_items WHERE status='enabled' AND action_type='url' AND regex=0", ARRAY_A) as $r) $red[untrailingslashit(urldecode($r['url']))] = $r['action_data'];
$final = function ($url) use ($map, $red) {
  $seen = 0; $u = $url;
  while ($seen++ < 4) {
    $path = untrailingslashit(urldecode((string) parse_url($u, PHP_URL_PATH)));
    if ($path === '') return $u;
    if (isset($red[$path])) { $u = $red[$path]; if (strpos($u, 'http') !== 0) $u = home_url($u); continue; }
    $pid = url_to_postid($u);
    if ($pid && isset($map[$pid])) { $u = get_permalink($map[$pid]); continue; }
    return $u;
  }
  return $u;
};
$skip = array_keys($map);
$rows = $wpdb->get_results("SELECT ID, post_content FROM {$wpdb->posts} WHERE post_type='post' AND post_status='publish'", ARRAY_A);
foreach ($rows as $r) {
  $id = (int) $r['ID']; if (in_array($id, $skip, true)) continue;
  $c = $r['post_content']; $n = 0; $self = get_permalink($id);
  $c2 = preg_replace_callback('~<a\s([^>]*?)href="(https?://cyberguard\.co\.il/[^"#?]*)([^"]*)"([^>]*)>(.*?)</a>~is', function ($m) use ($final, &$n, &$res, $id, $self) {
    $t = $final($m[2]);
    $tn = untrailingslashit(urldecode($t));
    if ($tn === untrailingslashit(urldecode($self))) { $n++; $res['pairs'][urldecode($m[2])] = 'SELF -> unlinked'; return $m[5]; }
    if ($tn === untrailingslashit(urldecode($m[2]))) return $m[0];
    $n++; $res['pairs'][urldecode($m[2])] = urldecode($t);
    return '<a ' . $m[1] . 'href="' . esc_url($t) . $m[3] . '"' . $m[4] . '>' . $m[5] . '</a>';
  }, $c);
  if ($n) {
    $res['changed'][$id] = $n;
    if ($APPLY) {
      if (!get_post_meta($id, '_cg_backup_content_20261109_links', true)) add_post_meta($id, '_cg_backup_content_20261109_links', wp_slash($c));
      $wpdb->update($wpdb->posts, ['post_content' => $c2], ['ID' => $id]); clean_post_cache($id);
      if (function_exists('rocket_clean_post')) rocket_clean_post($id);
    }
  }
}
$res['n_posts'] = count($res['changed']); $res['n_links'] = array_sum($res['changed']);
return $res;
