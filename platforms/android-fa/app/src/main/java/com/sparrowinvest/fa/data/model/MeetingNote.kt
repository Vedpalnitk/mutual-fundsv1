package com.sparrowinvest.fa.data.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MeetingNote(
    @SerialName("id") val id: String,
    @SerialName("clientId") val clientId: String? = null,
    @SerialName("prospectId") val prospectId: String? = null,
    @SerialName("title") val title: String,
    @SerialName("content") val content: String,
    @SerialName("meetingType") val meetingType: String,
    @SerialName("meetingDate") val meetingDate: String,
    @SerialName("createdAt") val createdAt: String? = null
) {
    val type: MeetingType get() = MeetingType.fromValue(meetingType)
}

@Serializable
data class CreateNoteRequest(
    @SerialName("title") val title: String,
    @SerialName("content") val content: String,
    @SerialName("meetingType") val meetingType: String,
    @SerialName("meetingDate") val meetingDate: String
)

enum class MeetingType(
    val value: String,
    val label: String,
    val color: Color,
    val icon: ImageVector
) {
    CALL("CALL", "Call", Color(0xFF3B82F6), Icons.Default.Call),
    IN_PERSON("IN_PERSON", "In Person", Color(0xFF10B981), Icons.Default.Groups),
    VIDEO("VIDEO", "Video", Color(0xFF8B5CF6), Icons.Default.Videocam),
    EMAIL("EMAIL", "Email", Color(0xFFF59E0B), Icons.Default.Email),
    OTHER("OTHER", "Other", Color(0xFF94A3B8), Icons.Default.MoreHoriz);

    companion object {
        fun fromValue(value: String): MeetingType =
            entries.find { it.value == value } ?: OTHER
    }
}
