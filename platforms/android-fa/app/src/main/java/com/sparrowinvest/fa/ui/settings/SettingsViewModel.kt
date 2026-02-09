package com.sparrowinvest.fa.ui.settings

import androidx.lifecycle.ViewModel
import com.sparrowinvest.fa.BuildConfig
import com.sparrowinvest.fa.core.storage.PreferencesManager
import com.sparrowinvest.fa.core.storage.ThemeMode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesManager: PreferencesManager
) : ViewModel() {

    private val _pushNotifications = MutableStateFlow(preferencesManager.pushNotificationsEnabled)
    val pushNotifications: StateFlow<Boolean> = _pushNotifications.asStateFlow()

    private val _emailNotifications = MutableStateFlow(preferencesManager.emailNotificationsEnabled)
    val emailNotifications: StateFlow<Boolean> = _emailNotifications.asStateFlow()

    private val _themeMode = MutableStateFlow(preferencesManager.themeMode)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    val appVersion: String = BuildConfig.VERSION_NAME
    val buildType: String = BuildConfig.BUILD_TYPE.replaceFirstChar { it.uppercase() }

    fun togglePush(enabled: Boolean) {
        preferencesManager.pushNotificationsEnabled = enabled
        _pushNotifications.value = enabled
    }

    fun toggleEmail(enabled: Boolean) {
        preferencesManager.emailNotificationsEnabled = enabled
        _emailNotifications.value = enabled
    }

    fun setThemeMode(mode: ThemeMode) {
        preferencesManager.themeMode = mode
        _themeMode.value = mode
    }

    fun clearCache() {
        preferencesManager.clearCache()
        // Reset to defaults after clearing
        _pushNotifications.value = true
        _emailNotifications.value = true
        _themeMode.value = ThemeMode.SYSTEM
    }
}
