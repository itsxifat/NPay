package com.npay.collector

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

class NPayApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Payment activity",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply { description = "Verified incoming payments" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "npay_payments"
    }
}
