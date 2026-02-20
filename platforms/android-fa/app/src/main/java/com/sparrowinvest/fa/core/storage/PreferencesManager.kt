package com.sparrowinvest.fa.core.storage

import android.content.SharedPreferences
import com.sparrowinvest.fa.data.model.AdvisorProfile
import com.sparrowinvest.fa.data.model.FAUser
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

class PreferencesManager @Inject constructor(
    private val sharedPreferences: SharedPreferences
) {
    companion object {
        private const val KEY_IS_AUTHENTICATED = "is_authenticated"
        private const val KEY_CURRENT_USER = "current_user"
        private const val KEY_ADVISOR_PROFILE = "advisor_profile"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_PUSH_NOTIFICATIONS = "push_notifications_enabled"
        private const val KEY_EMAIL_NOTIFICATIONS = "email_notifications_enabled"
    }

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    var isAuthenticated: Boolean
        get() = sharedPreferences.getBoolean(KEY_IS_AUTHENTICATED, false)
        set(value) = sharedPreferences.edit().putBoolean(KEY_IS_AUTHENTICATED, value).apply()

    var themeMode: ThemeMode
        get() = ThemeMode.fromString(sharedPreferences.getString(KEY_THEME_MODE, ThemeMode.SYSTEM.name))
        set(value) = sharedPreferences.edit().putString(KEY_THEME_MODE, value.name).apply()

    var pushNotificationsEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_PUSH_NOTIFICATIONS, true)
        set(value) = sharedPreferences.edit().putBoolean(KEY_PUSH_NOTIFICATIONS, value).apply()

    var emailNotificationsEnabled: Boolean
        get() = sharedPreferences.getBoolean(KEY_EMAIL_NOTIFICATIONS, true)
        set(value) = sharedPreferences.edit().putBoolean(KEY_EMAIL_NOTIFICATIONS, value).apply()

    fun clearCache() {
        sharedPreferences.edit().apply {
            // Clear non-auth preferences (keep auth state and user)
            remove(KEY_THEME_MODE)
            remove(KEY_PUSH_NOTIFICATIONS)
            remove(KEY_EMAIL_NOTIFICATIONS)
            apply()
        }
    }

    fun saveUser(user: FAUser) {
        try {
            val userJson = json.encodeToString(user)
            sharedPreferences.edit().putString(KEY_CURRENT_USER, userJson).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getUser(): FAUser? {
        return try {
            val userJson = sharedPreferences.getString(KEY_CURRENT_USER, null)
            userJson?.let { json.decodeFromString<FAUser>(it) }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun clearUser() {
        sharedPreferences.edit().remove(KEY_CURRENT_USER).apply()
    }

    fun saveAdvisorProfile(profile: AdvisorProfile) {
        try {
            val profileJson = json.encodeToString(profile)
            sharedPreferences.edit().putString(KEY_ADVISOR_PROFILE, profileJson).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getAdvisorProfile(): AdvisorProfile? {
        return try {
            val profileJson = sharedPreferences.getString(KEY_ADVISOR_PROFILE, null)
            profileJson?.let { json.decodeFromString<AdvisorProfile>(it) }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun clearAll() {
        sharedPreferences.edit().apply {
            remove(KEY_IS_AUTHENTICATED)
            remove(KEY_CURRENT_USER)
            remove(KEY_ADVISOR_PROFILE)
            apply()
        }
    }
}

enum class ThemeMode {
    LIGHT, DARK, SYSTEM;

    companion object {
        fun fromString(value: String?): ThemeMode {
            return entries.find { it.name == value } ?: SYSTEM
        }
    }
}
