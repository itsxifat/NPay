package com.npay.collector.sms

import android.content.Context
import com.npay.collector.data.ApiClient
import com.npay.collector.data.EventLog
import com.npay.collector.data.ForwardEvent
import com.npay.collector.data.Prefs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Shared entry point used by every SMS receiver. Filters for bKash payment
 * messages, forwards them to the server off the main thread, and records the
 * outcome for the in-app activity log.
 */
object SmsForwarder {

    private val scope = CoroutineScope(Dispatchers.IO)

    fun handle(context: Context, sender: String, body: String, receivedAt: Long) {
        if (!SmsParser.looksLikeBkash(sender, body)) return

        val appContext = context.applicationContext
        scope.launch {
            val config = Prefs.get(appContext).current()
            if (!config.isConfigured) {
                EventLog.add(
                    ForwardEvent(
                        timestamp = receivedAt,
                        sender = sender,
                        preview = SmsParser.preview(body),
                        outcome = "ERROR",
                        detail = "App not enrolled — set server URL & device key",
                    )
                )
                return@launch
            }

            val result = ApiClient.ingestSms(
                serverUrl = config.serverUrl,
                deviceKey = config.deviceKey,
                sender = sender,
                body = body,
                receivedAt = receivedAt,
            )

            EventLog.add(
                ForwardEvent(
                    timestamp = receivedAt,
                    sender = sender,
                    preview = SmsParser.preview(body),
                    outcome = result.status,
                    detail = result.detail,
                )
            )

            if (result.ok && result.status == "VERIFIED") {
                Notifier.showVerified(appContext, SmsParser.preview(body), result.detail)
            }
        }
    }
}
