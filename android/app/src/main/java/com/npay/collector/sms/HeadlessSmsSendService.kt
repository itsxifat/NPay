package com.npay.collector.sms

import android.app.Service
import android.content.Intent
import android.os.IBinder

/**
 * Required "respond via message" service for default-SMS-app eligibility.
 * NPay is a capture/verification tool and does not send quick replies, so the
 * service accepts the intent and does nothing.
 */
class HeadlessSmsSendService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        stopSelf(startId)
        return START_NOT_STICKY
    }
}
