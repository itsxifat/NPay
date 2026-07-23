package com.npay.collector.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony

/**
 * Fires only when NPay is the default SMS app (ACTION_SMS_DELIVER). This is the
 * primary path: as the default handler the app receives every SMS on every SIM.
 */
class SmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_DELIVER_ACTION) return
        SmsIngest.fromIntent(context, intent)
    }
}
