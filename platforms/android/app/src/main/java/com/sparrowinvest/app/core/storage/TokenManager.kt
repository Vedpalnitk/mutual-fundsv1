package com.sparrowinvest.app.core.storage

import android.content.SharedPreferences
import javax.inject.Inject

class TokenManager @Inject constructor(
    private val sharedPreferences: SharedPreferences
) {
    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_TOKEN_EXPIRY = "token_expiry"
    }

    fun saveTokens(accessToken: String, refreshToken: String? = null, expiryTime: Long? = null) {
        sharedPreferences.edit().apply {
            putString(KEY_ACCESS_TOKEN, accessToken)
            refreshToken?.let { putString(KEY_REFRESH_TOKEN, it) }
            expiryTime?.let { putLong(KEY_TOKEN_EXPIRY, it) }
            apply()
        }
    }

    fun getAccessToken(): String? {
        return sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }

    fun getRefreshToken(): String? {
        return sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }

    fun getTokenExpiry(): Long {
        return sharedPreferences.getLong(KEY_TOKEN_EXPIRY, 0L)
    }

    fun isTokenValid(): Boolean {
        val token = getAccessToken() ?: return false
        val expiry = getTokenExpiry()
        return token.isNotEmpty() && (expiry == 0L || expiry > System.currentTimeMillis())
    }

    fun clearTokens() {
        sharedPreferences.edit().apply {
            remove(KEY_ACCESS_TOKEN)
            remove(KEY_REFRESH_TOKEN)
            remove(KEY_TOKEN_EXPIRY)
            apply()
        }
    }

    fun hasToken(): Boolean = getAccessToken() != null
}
