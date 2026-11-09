import json, os
S = os.environ['S']
keys = json.load(open(f'{S}/fix/s18keys.json'))
code = r'''
global $wpdb;
$APPLY = APPLYFLAG; $skip = json_decode('SKIP', true);
$rows = $wpdb->get_results("SELECT ID,post_content FROM {$wpdb->posts} WHERE post_type='post' AND post_status='publish' AND (post_content LIKE '%אשכול התוכן%' OR post_content LIKE '%מה המשתמש באמת צריך לפתור%')", ARRAY_A);
$res = ['n'=>0,'changed'=>[], 'sample'=>[], 'left'=>[]];
foreach ($rows as $r) {
  $id = (int)$r['ID']; if (in_array($id, $skip, true)) continue;
  $c = $r['post_content']; $orig = $c; $log = [];
  $re = '~<h2[^>]*>\s*מאמר מרכזי להמשך טיפול\s*</h2>\s*<p>\s*העמוד הזה (?:הוא חלק מ|מחזק את )אשכול התוכן של <strong>[^<]*</strong>\.\s*להמשך טיפול מומלץ לעבור גם למדריך המרכזי:\s*(<a [^>]*href="([^"]+)"[^>]*>[^<]*</a>)\.?\s*</p>\s*~u';
  if (preg_match($re, $c, $m, PREG_OFFSET_CAPTURE)) {
    $full = $m[0][0]; $pos = $m[0][1]; $link = $m[1][0]; $url = $m[2][0];
    $after = substr($c, $pos + strlen($full));
    $tid = url_to_postid(urldecode($url)); $map = json_decode('MAP', true);
    if ($tid === $id || (isset($map[$tid]) && (int)$map[$tid] === $id)) { $c = substr($c, 0, $pos) . $after; $log[] = 'self-hub dropped'; goto usr; }
    if (preg_match('~^(<h3[^>]*>[^<]*</h3>\s*)<ul>~u', $after, $mm)) {
      $ul = substr($after, 0, (int)strpos($after, '</ul>'));
      if (stripos($ul, $url) === false) { $after = $mm[1] . '<ul><li>' . $link . '</li>' . substr($after, strlen($mm[0])); $log[] = 'hub->list'; }
      else $log[] = 'hub already in list';
      $c = substr($c, 0, $pos) . $after;
    } else {
      $c = substr($c, 0, $pos) . '<p>המדריך המלא בנושא: ' . $link . '</p>' . "\n\n" . $after; $log[] = 'hub->p';
    }
    if (count($res['sample']) < 2) $res['sample'][$id] = substr($c, max(0, $pos - 150), 700);
  }
  usr:
  $re2 = '~<h2[^>]*>\s*מה המשתמש באמת צריך לפתור\?\s*</h2>\s*<p>(?:(?!</p>).)*</p>\s*~us';
  $c2 = preg_replace($re2, '', $c, 1, $k); if ($k) { $c = $c2; $log[] = 'usr removed'; }
  if (mb_strpos($c, 'אשכול התוכן') !== false || mb_strpos($c, 'מה המשתמש באמת') !== false) $res['left'][] = $id;
  if ($c !== $orig) {
    $res['n']++; $res['changed'][$id] = implode(',', $log) . ' -' . (strlen($orig) - strlen($c));
    if ($APPLY) {
      if (!get_post_meta($id, '_cg_backup_content_20261109_boiler', true)) add_post_meta($id, '_cg_backup_content_20261109_boiler', wp_slash($orig));
      $wpdb->update($wpdb->posts, ['post_content' => $c], ['ID' => $id]); clean_post_cache($id);
    }
  }
}
return $res;
'''
for f, flag in (('p5dry', 'false'), ('p5', 'true')):
    open(f'{S}/fix/{f}.php', 'w').write(code.replace('APPLYFLAG', flag).replace('SKIP', json.dumps(keys)).replace('MAP', json.dumps(json.load(open(f'{S}/fix/s18map.json')))))
