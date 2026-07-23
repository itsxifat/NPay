package com.npay.collector.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Fallback path (ACTION_SMS_RECEIVED) that fires when the app merely holds the
 * RECEIVE_SMS permission but is not the default handler. Lets NPay capture
 * payment SMS even before the user grants the default-SMS role.
 */
class SmsReceivedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        SmsIngest.fromIntent(context, intent)
    }
}
