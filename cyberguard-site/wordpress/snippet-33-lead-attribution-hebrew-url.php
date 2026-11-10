/* Elementor runs sanitize_text_field() on hidden fields, and that function strips percent-encoded bytes,
   so a landing URL like /%D7%A9%D7%97.../ was saved as /--/ (every lead since 9.9.2026 lost its page).
   Before the form actions run (save to database, email, webhook), replace the two URL fields with the
   decoded raw value, sanitized. Turn off: deactivate this snippet. */
if (!function_exists('cg_attr_keep_hebrew_rec')) {
	function cg_attr_keep_hebrew_rec($record) {
		if (!is_object($record) || !method_exists($record, 'get') || !method_exists($record, 'update_field')) return $record;
		$fields = (array) $record->get('fields');
		foreach (['cg_landing_url', 'cg_referrer'] as $id) {
			if (empty($fields[$id])) continue;
			$raw = $fields[$id]['raw_value'] ?? '';
			if (!is_string($raw) || $raw === '' || strpos($raw, '%') === false) continue;
			$record->update_field($id, 'value', sanitize_text_field(rawurldecode($raw)));
		}
		return $record;
	}
	add_filter('elementor_pro/forms/record/actions_before', 'cg_attr_keep_hebrew_rec', 5, 1);
}
