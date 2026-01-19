package com.sparrowinvest.app.core.di

import com.sparrowinvest.app.core.network.ApiService
import com.sparrowinvest.app.core.storage.PreferencesManager
import com.sparrowinvest.app.core.storage.TokenManager
import com.sparrowinvest.app.data.repository.AuthRepository
import com.sparrowinvest.app.data.repository.FundsRepository
import com.sparrowinvest.app.data.repository.GoalsRepository
import com.sparrowinvest.app.data.repository.PortfolioRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideAuthRepository(
        apiService: ApiService,
        tokenManager: TokenManager,
        preferencesManager: PreferencesManager
    ): AuthRepository {
        return AuthRepository(apiService, tokenManager, preferencesManager)
    }

    @Provides
    @Singleton
    fun provideFundsRepository(
        apiService: ApiService
    ): FundsRepository {
        return FundsRepository(apiService)
    }

    @Provides
    @Singleton
    fun providePortfolioRepository(
        apiService: ApiService
    ): PortfolioRepository {
        return PortfolioRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideGoalsRepository(
        apiService: ApiService
    ): GoalsRepository {
        return GoalsRepository(apiService)
    }
}
