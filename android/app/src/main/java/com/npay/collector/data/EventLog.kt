package com.npay.collector.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/** In-memory ring buffer of recent forwarding events, surfaced in the UI. */
object EventLog {
    private const val MAX = 50
    private val _events = MutableStateFlow<List<ForwardEvent>>(emptyList())
    val events: StateFlow<List<ForwardEvent>> = _events

    fun add(event: ForwardEvent) {
        _events.value = (listOf(event) + _events.value).take(MAX)
    }
}

data class ForwardEvent(
    val timestamp: Long,
    val sender: String,
    val preview: String,
    val outcome: String, // VERIFIED | UNRECONCILED | DUPLICATE | IGNORED | ERROR
    val detail: String = "",
)
