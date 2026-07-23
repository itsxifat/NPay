package com.npay.collector.sms

import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Extracts full SMS bodies from a broadcast intent. Multipart (concatenated)
 * messages are joined by originating address so the server sees the complete
 * bKash text as one message.
 */
object SmsIngest {
    fun fromIntent(context: Context, intent: Intent) {
        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        if (messages.isEmpty()) return

        val sender = messages.first().displayOriginatingAddress ?: "unknown"
        val body = messages.joinToString(separator = "") { it.displayMessageBody.orEmpty() }
        val receivedAt = messages.first().timestampMillis.takeIf { it > 0 }
            ?: System.currentTimeMillis()

        if (body.isNotBlank()) {
            SmsForwarder.handle(context, sender, body, receivedAt)
        }
    }
}
