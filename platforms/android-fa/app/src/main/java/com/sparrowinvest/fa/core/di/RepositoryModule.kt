package com.sparrowinvest.fa.core.di

import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.core.storage.PreferencesManager
import com.sparrowinvest.fa.core.storage.TokenManager
import com.sparrowinvest.fa.data.repository.AuthRepository
import com.sparrowinvest.fa.data.repository.ChatRepository
import com.sparrowinvest.fa.data.repository.ClientRepository
import com.sparrowinvest.fa.data.repository.CommunicationRepository
import com.sparrowinvest.fa.data.repository.FundsRepository
import com.sparrowinvest.fa.data.repository.InsightsRepository
import com.sparrowinvest.fa.data.repository.NotificationRepository
import com.sparrowinvest.fa.data.repository.SipRepository
import com.sparrowinvest.fa.data.repository.TransactionRepository
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
        preferencesManager: PreferencesManager,
        chatRepository: ChatRepository
    ): AuthRepository {
        return AuthRepository(apiService, tokenManager, preferencesManager, chatRepository)
    }

    @Provides
    @Singleton
    fun provideClientRepository(
        apiService: ApiService
    ): ClientRepository {
        return ClientRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideTransactionRepository(
        apiService: ApiService
    ): TransactionRepository {
        return TransactionRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideSipRepository(
        apiService: ApiService
    ): SipRepository {
        return SipRepository(apiService)
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
    fun provideChatRepository(
        apiService: ApiService
    ): ChatRepository {
        return ChatRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideInsightsRepository(
        apiService: ApiService
    ): InsightsRepository {
        return InsightsRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideNotificationRepository(
        apiService: ApiService
    ): NotificationRepository {
        return NotificationRepository(apiService)
    }

    @Provides
    @Singleton
    fun provideCommunicationRepository(
        apiService: ApiService
    ): CommunicationRepository {
        return CommunicationRepository(apiService)
    }
}
