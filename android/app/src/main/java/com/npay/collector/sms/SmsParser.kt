package com.npay.collector.sms

/**
 * Lightweight on-device check for whether an SMS looks like a bKash payment.
 * The server does the authoritative parsing and reconciliation; here we only
 * decide whether a message is worth forwarding and build a short preview.
 */
object SmsParser {

    private val bkashReceived = Regex(
        "received\\s+Tk\\s+([\\d,]+(?:\\.\\d{1,2})?)\\s+from\\s+(01\\d{9})",
        RegexOption.IGNORE_CASE,
    )

    fun looksLikeBkash(sender: String, body: String): Boolean {
        val s = sender.lowercase()
        val looksBkashSender = s.contains("bkash")
        return looksBkashSender || bkashReceived.containsMatchIn(body)
    }

    /** A compact one-line preview for the activity log. */
    fun preview(body: String): String {
        val m = bkashReceived.find(body) ?: return body.take(60)
        val (amount, phone) = m.destructured
        return "Tk $amount from $phone"
    }
}
