package com.sparrowinvest.fa.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val accessToken: String,
    val refreshToken: String? = null,
    val user: FAUser? = null,
    val expiresIn: Long? = null
)

@Serializable
data class FAUser(
    val id: String,
    val email: String,
    val name: String? = null,
    val phone: String? = null,
    val role: String = "advisor",
    val createdAt: String? = null
) {
    val displayName: String get() = name ?: email.substringBefore("@").replace(".", " ").split(" ").joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
    val initials: String get() = displayName.split(" ").mapNotNull { it.firstOrNull()?.uppercase() }.take(2).joinToString("")
}
