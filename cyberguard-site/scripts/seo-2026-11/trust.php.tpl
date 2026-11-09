/* CG Article trust blocks (2026-11-09)
   From the SEO audit (seo/article-audit.md, site-level findings 2, 4, 5, 6, 7):
   - under the H1: a short "private company, not affiliated" line (platform-specific)
   - "the official, free route" box after the opening paragraph, with official help links
   - one matching service-page box before the FAQ (only on posts that did not link their service page)
   - testimonial videos that match the post's platform (mixed set with a neutral heading when none match)
   - the hero shows the publish date; "updated" appears only when post meta _cg_updated (Y-m-d) is set
     for a real content update, instead of the bulk modified date.
   Turn off: deactivate this snippet (the original [cg_hero]/[cg_voices] come back as they were). */

if (!function_exists('cg26_data')) : // guard: Code Snippets re-runs the code when it is saved

function cg26_data() {
	static $d = null;
	if (null === $d) $d = json_decode(base64_decode('DATA'), true);
	return $d;
}
function cg26_post($id) { $d = cg26_data(); return isset($d['posts'][$id]) ? $d['posts'][$id] : null; }
function cg26_platform($id) {
	$p = cg26_post($id);
	if ($p) return $p['pl'];
	$terms = get_the_terms($id, 'category'); $map = ['פייסבוק' => 'facebook', 'אינסטגרם' => 'instagram', 'וואטסאפ' => 'whatsapp', 'טיקטוק' => 'tiktok', 'טלגרם' => 'telegram', 'locked-phone-recovery' => 'phone'];
	if ($terms && !is_wp_error($terms)) foreach ($terms as $t) { $s = urldecode($t->slug); if (isset($map[$s])) return $map[$s]; }
	return 'general';
}
function cg26_dfmt($ts) {
	$m = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
	return (int) date('j', $ts) . ' ב' . $m[(int) date('n', $ts) - 1] . ' ' . date('Y', $ts);
}

function cg26_hero() {
	if (!is_singular('post') || !function_exists('cg_part_term')) return '';
	$id = get_the_ID(); $term = cg_part_term($id);
	$dek = trim(wp_strip_all_tags(get_the_excerpt($id)));
	$rt = cg_part_reading_time($id);
	$auth = get_the_author_meta('display_name', (int) get_post_field('post_author', $id));
	$pl = cg26_platform($id); $d = cg26_data();
	$who = isset($d['who'][$pl]) ? $d['who'][$pl] : $d['who']['general'];
	$pub = get_post_time('U', true, $id);
	$upd = get_post_meta($id, '_cg_updated', true);
	$updts = $upd ? strtotime($upd . ' 12:00:00') : 0;
	$cal = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
	$date = ($updts && $updts > $pub + DAY_IN_SECONDS)
		? '<span>' . $cal . 'עודכן <time datetime="' . esc_attr(date('Y-m-d', $updts)) . '">' . esc_html(cg26_dfmt($updts)) . '</time></span>'
		: '<span>' . $cal . 'פורסם <time datetime="' . esc_attr(date('Y-m-d', $pub)) . '">' . esc_html(cg26_dfmt($pub)) . '</time></span>';
	$has_off = isset($d['official'][$pl]);
	$o  = '<div class="cga cgh" dir="rtl"><div class="cgh-glow" aria-hidden="true"></div><div class="cgh-in">';
	$o .= '<nav class="cgh-crumbs" aria-label="ניווט"><a href="' . esc_url(home_url('/')) . '">בית</a> <span aria-hidden="true">›</span> ';
	if ($term) $o .= '<a href="' . esc_url(get_term_link($term)) . '">' . esc_html($term->name) . '</a> <span aria-hidden="true">›</span> ';
	$o .= '<span class="cgh-here">' . esc_html(wp_trim_words(get_the_title($id), 6, '…')) . '</span></nav>';
	if ($term) $o .= '<span class="cgh-chip"><i aria-hidden="true"></i>' . esc_html($term->name) . '</span>';
	$o .= '<h1 class="cgh-title">' . esc_html(get_the_title($id)) . '</h1>';
	if ('' !== $dek) $o .= '<p class="cgh-dek">' . esc_html($dek) . '</p>';
	$o .= '<p class="cgh-disc" style="margin:10px 0 0;font-size:13.5px;line-height:1.6;color:rgba(255,255,255,.78);max-width:760px">'
		. 'CyberGuard היא חברה פרטית, בלי קשר רשמי ל-' . esc_html($who) . '. '
		. ($has_off ? '<a href="#cg-official" style="color:#fff;text-decoration:underline">הדרך הרשמית</a> חינמית, והיא מופיעה בתחילת המדריך.' : 'אנחנו עובדים רק דרך הערוצים הרשמיים.')
		. '</p>';
	$o .= '<div class="cgh-meta">';
	if ($auth) $o .= '<span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>' . esc_html($auth) . '</span>';
	$o .= '<span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' . (int) $rt . ' דק׳ קריאה</span>' . $date . '</div></div></div>';
	return $o;
}

function cg26_voices() {
	if (!function_exists('cg_part_voices_slides')) return '';
	$all = cg_part_voices_slides(); if (count($all) < 3) return '';
	$pl = cg26_platform(get_the_ID()); $d = cg26_data();
	$re = isset($d['voice_re'][$pl]) ? $d['voice_re'][$pl] : '';
	$pick = $re ? array_values(array_filter($all, function ($v) use ($re) { return preg_match('~' . $re . '~u', $v['alt']); })) : [];
	$matched = count($pick) >= 3;
	if (!$matched) { // mixed set: one video per platform, so no single platform dominates
		$groups = []; foreach ($all as $v) { foreach (['פייסבוק', 'אינסטגרם', 'וואטצאפ|וואטסאפ'] as $g) { if (preg_match('~' . $g . '~u', $v['alt'])) { $groups[$g][] = $v; break; } } }
		$pick = []; $n = (int) get_the_ID(); foreach ($groups as $g) $pick[] = $g[$n % count($g)];
		if (count($pick) < 3) $pick = $all;
	}
	$start = $matched ? ((int) get_the_ID()) % count($pick) : 0; $cards = '';
	for ($i = 0; $i < 3; $i++) {
		$v = $pick[($start + $i) % count($pick)];
		$href = '' !== $v['video'] ? $v['video'] : '#'; $cap = '' !== $v['alt'] ? $v['alt'] : 'סיפור לקוח';
		$cards .= '<a class="cgv-card" href="' . esc_url($href) . '" target="_blank" rel="noopener noreferrer"><img class="cgv-bg" src="' . esc_url($v['img']) . '" alt="' . esc_attr($cap) . '" loading="lazy" decoding="async" /><span class="cgv-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><span class="cgv-cap">' . esc_html($cap) . '<i>צפו בעדות הלקוח</i></span></a>';
	}
	$head = $matched ? $d['voice_head'][$pl] : 'לקוחות מספרים איך קיבלו בחזרה את החשבון';
	$sub = $matched ? 'לקוחות שאיבדו גישה לחשבון מספרים במילים שלהם מה קרה ואיך זה נפתר.' : 'עדויות וידאו של לקוחות מפלטפורמות שונות. הפלטפורמה של כל מקרה כתובה על הסרטון.';
	return '<div class="cga cgvs" dir="rtl"><div class="cgvs-head"><b>' . esc_html($head) . '</b><span>' . esc_html($sub) . '</span></div><div class="cgvs-grid">' . $cards . '</div></div>';
}

/* Contact card in the sidebar: same as [cg_cta_card], plus a plain "private service" label (audit A4). */
function cg26_cta_card() {
	if (!function_exists('cg_part_cta_card')) return '';
	$html = cg_part_cta_card();
	$label = '<p class="cgc-private" style="margin:8px 0 0;font-size:12.5px;line-height:1.5;opacity:.75">CyberGuard היא שירות פרטי, ולא התמיכה הרשמית של הפלטפורמה.</p>';
	return preg_replace('~(<p class="cgc-text">.*?</p>)~s', '$1' . $label, $html, 1);
}

add_action('wp', function () {
	if (is_admin() || !is_singular('post')) return;
	if (shortcode_exists('cg_hero')) add_shortcode('cg_hero', 'cg26_hero');
	if (shortcode_exists('cg_voices')) add_shortcode('cg_voices', 'cg26_voices');
	if (shortcode_exists('cg_cta_card')) add_shortcode('cg_cta_card', 'cg26_cta_card');
});

add_filter('the_content', function ($content) {
	static $done = false;
	if ($done || is_admin() || is_feed() || !is_singular('post') || !did_action('wp_body_open')) return $content;
	$id = get_queried_object_id();
	if (get_the_ID() !== $id) return $content;
	$done = true;
	$d = cg26_data(); $pl = cg26_platform($id); $p = cg26_post($id);
	// official route box, right after the opening paragraph
	if (isset($d['official'][$pl]) && false === strpos($content, 'id="cg-official"')) {
		$off = $d['official'][$pl]; $li = '';
		foreach ($off['links'] as $l) $li .= '<li style="margin:4px 0"><a href="' . esc_url($l[1]) . '" target="_blank" rel="noopener" style="color:#5b21b6;font-weight:600">' . esc_html($l[0]) . '</a>' . (isset($l[2]) ? ' <span style="color:#4b4566">' . esc_html($l[2]) . '</span>' : '') . '</li>';
		$box = '<div id="cg-official" class="cg-official" style="margin:22px 0;padding:16px 20px;border-radius:12px;background:#f3fbf6;border:1px solid #cdebd8;border-right:4px solid #16a34a;direction:rtl">'
			. '<div style="font-weight:700;font-size:17px;color:#14532d;margin-bottom:6px">הדרך הרשמית והחינמית: כדאי לנסות אותה קודם</div>'
			. '<p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#1f2d24">' . esc_html($off['intro']) . '</p>'
			. '<ul style="margin:0;padding-right:20px;font-size:15px;line-height:1.6">' . $li . '</ul></div>';
		$pos = stripos($content, '</p>');
		$content = false !== $pos ? substr($content, 0, $pos + 4) . "\n" . $box . substr($content, $pos + 4) : $box . $content;
	}
	// matching service page, once, before the FAQ / related list (never above the content)
	if ($p && !empty($p['svc']) && empty($p['has_svc']) && isset($d['svc'][$p['svc']]) && false === strpos($content, 'cg-svc-box') && false === strpos($content, 'cg-svc-link')) {
		$s = $d['svc'][$p['svc']];
		$box = '<div class="cg-svc-box" style="margin:26px 0;padding:18px 20px;border-radius:12px;background:#faf8ff;border:1px solid #e6e0f7;border-right:4px solid #7c3aed;direction:rtl">'
			. '<div style="font-weight:700;font-size:17px;color:#1f1a33;margin-bottom:6px">ניסיתם את הדרך הרשמית וזה לא עבד?</div>'
			. '<p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#3b3550">' . esc_html($s['why']) . ' אנחנו עובדים רק דרך הערוצים הרשמיים של הפלטפורמה, ולא מבקשים סיסמה או קוד אימות.</p>'
			. '<a href="' . esc_url(home_url($p['svc'])) . '" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;text-decoration:none">' . esc_html($s['anchor']) . ' ←</a></div>';
		if (preg_match('~<h2\b[^>]*>[^<]*שאלות נפוצות~u', $content, $m, PREG_OFFSET_CAPTURE)) $at = $m[0][1];
		elseif (preg_match('~<h3\b[^>]*>\s*(?:מאמרים קשורים|עוד מדריכים)~u', $content, $m, PREG_OFFSET_CAPTURE)) $at = $m[0][1];
		else $at = strlen($content);
		$content = substr($content, 0, $at) . $box . "\n" . substr($content, $at);
	}
	return $content;
}, 15);

/* Mid-article CTA (content filter, priority 30): say it is a private service, and drop "ליווי מול הפלטפורמה". */
add_filter('the_content', function ($content) {
	if (is_admin() || !is_singular('post')) return $content;
	return str_replace('בדיקת זכאות ראשונית ללא עלות · ליווי מול הפלטפורמה · תמחור ברור מראש', 'שירות פרטי · בדיקה ראשונית ללא עלות · עבודה דרך הערוצים הרשמיים', $content);
}, 31);

endif; // cg26_loaded
