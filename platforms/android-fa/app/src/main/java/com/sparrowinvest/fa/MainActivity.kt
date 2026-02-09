package com.sparrowinvest.fa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.sparrowinvest.fa.core.storage.PreferencesManager
import com.sparrowinvest.fa.core.storage.ThemeMode
import com.sparrowinvest.fa.ui.navigation.NavGraph
import com.sparrowinvest.fa.ui.theme.SparrowFATheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.MutableStateFlow
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var preferencesManager: PreferencesManager

    companion object {
        val themeModeFlow = MutableStateFlow(ThemeMode.SYSTEM)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize theme from preferences
        themeModeFlow.value = preferencesManager.themeMode

        setContent {
            val themeMode by themeModeFlow.collectAsState()
            val systemDarkTheme = isSystemInDarkTheme()

            val isDarkTheme = when (themeMode) {
                ThemeMode.DARK -> true
                ThemeMode.LIGHT -> false
                ThemeMode.SYSTEM -> systemDarkTheme
            }

            SparrowFATheme(darkTheme = isDarkTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavGraph()
                }
            }
        }
    }
}
