package com.npay.collector.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "npay_prefs")

/** Persisted enrollment config: which server to forward to and the device key. */
class Prefs(private val context: Context) {

    val config: Flow<AppConfig> = context.dataStore.data.map { p ->
        AppConfig(
            serverUrl = p[SERVER_URL].orEmpty(),
            deviceKey = p[DEVICE_KEY].orEmpty(),
        )
    }

    suspend fun current(): AppConfig = config.first()

    suspend fun save(serverUrl: String, deviceKey: String) {
        context.dataStore.edit { p ->
            p[SERVER_URL] = serverUrl.trim().trimEnd('/')
            p[DEVICE_KEY] = deviceKey.trim()
        }
    }

    companion object {
        private val SERVER_URL = stringPreferencesKey("server_url")
        private val DEVICE_KEY = stringPreferencesKey("device_key")

        @Volatile private var instance: Prefs? = null
        fun get(context: Context): Prefs =
            instance ?: synchronized(this) {
                instance ?: Prefs(context.applicationContext).also { instance = it }
            }
    }
}

data class AppConfig(val serverUrl: String, val deviceKey: String) {
    val isConfigured: Boolean get() = serverUrl.isNotBlank() && deviceKey.isNotBlank()
}
