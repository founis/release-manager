// Snippet 18: point every source straight at its final target (no 301 chains after the new merges).
global $wpdb; $t = $wpdb->prefix . 'snippets';
$code = $wpdb->get_var("SELECT code FROM $t WHERE id=18");
preg_match_all('/\b(\d+)=>(\d+)\b/', $code, $mm, PREG_SET_ORDER); $map = []; foreach ($mm as $m) $map[(int)$m[1]] = (int)$m[2];
$fin = function ($v) use ($map) { $n = 0; while (isset($map[$v]) && $n++ < 6) $v = $map[$v]; return $v; };
$ch = []; $new = $code;
foreach ($map as $k => $v) { $f = $fin($v); if ($f !== $v) { $new = preg_replace('/\b' . $k . '=>' . $v . '\b/', $k . '=>' . $f, $new); $ch[] = "$k: $v -> $f"; } }
if ($new !== $code) {
  if (!get_option('cg_backup_snippet18_20261109c')) update_option('cg_backup_snippet18_20261109c', $code, false);
  $wpdb->update($t, ['code' => $new, 'modified' => current_time('mysql', 1)], ['id' => 18]);
  if (function_exists('\Code_Snippets\clean_snippets_cache')) \Code_Snippets\clean_snippets_cache($t);
}
if (function_exists('rocket_clean_domain')) rocket_clean_domain();
return ['flattened' => $ch, 'pairs' => count($map)];
