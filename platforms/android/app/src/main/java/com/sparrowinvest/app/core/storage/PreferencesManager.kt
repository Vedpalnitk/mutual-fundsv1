package com.sparrowinvest.app.core.storage

import android.content.SharedPreferences
import com.sparrowinvest.app.data.model.User
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

class PreferencesManager @Inject constructor(
    private val sharedPreferences: SharedPreferences
) {
    companion object {
        private const val KEY_IS_AUTHENTICATED = "is_authenticated"
        private const val KEY_IS_GUEST_USER = "is_guest_user"
        private const val KEY_HAS_COMPLETED_ONBOARDING = "has_completed_onboarding"
        private const val KEY_CURRENT_USER = "current_user"
        private const val KEY_THEME_MODE = "theme_mode"
    }

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    var isAuthenticated: Boolean
        get() = sharedPreferences.getBoolean(KEY_IS_AUTHENTICATED, false)
        set(value) = sharedPreferences.edit().putBoolean(KEY_IS_AUTHENTICATED, value).apply()

    var isGuestUser: Boolean
        get() = sharedPreferences.getBoolean(KEY_IS_GUEST_USER, false)
        set(value) = sharedPreferences.edit().putBoolean(KEY_IS_GUEST_USER, value).apply()

    var hasCompletedOnboarding: Boolean
        get() = sharedPreferences.getBoolean(KEY_HAS_COMPLETED_ONBOARDING, false)
        set(value) = sharedPreferences.edit().putBoolean(KEY_HAS_COMPLETED_ONBOARDING, value).apply()

    var themeMode: ThemeMode
        get() = ThemeMode.fromString(sharedPreferences.getString(KEY_THEME_MODE, ThemeMode.SYSTEM.name))
        set(value) = sharedPreferences.edit().putString(KEY_THEME_MODE, value.name).apply()

    fun saveUser(user: User) {
        try {
            val userJson = json.encodeToString(user)
            sharedPreferences.edit().putString(KEY_CURRENT_USER, userJson).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getUser(): User? {
        return try {
            val userJson = sharedPreferences.getString(KEY_CURRENT_USER, null)
            userJson?.let { json.decodeFromString<User>(it) }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun clearUser() {
        sharedPreferences.edit().remove(KEY_CURRENT_USER).apply()
    }

    fun clearAll() {
        sharedPreferences.edit().apply {
            remove(KEY_IS_AUTHENTICATED)
            remove(KEY_IS_GUEST_USER)
            remove(KEY_CURRENT_USER)
            // Keep onboarding preference
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
