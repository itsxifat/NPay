package com.npay.collector.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Required for default-SMS-app eligibility. NPay does not process MMS payment
 * data, so this is intentionally a no-op receiver.
 */
class MmsDeliverReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // No-op: bKash payment notifications arrive as SMS, not MMS.
    }
}
