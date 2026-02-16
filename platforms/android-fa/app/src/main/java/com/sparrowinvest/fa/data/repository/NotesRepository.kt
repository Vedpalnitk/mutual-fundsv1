package com.sparrowinvest.fa.data.repository

import com.sparrowinvest.fa.core.network.ApiResult
import com.sparrowinvest.fa.core.network.ApiService
import com.sparrowinvest.fa.data.model.CreateNoteRequest
import com.sparrowinvest.fa.data.model.MeetingNote
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotesRepository @Inject constructor(
    private val apiService: ApiService
) {

    suspend fun getClientNotes(clientId: String): ApiResult<List<MeetingNote>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getClientNotes(clientId)
            if (response.isSuccessful) {
                response.body()?.let { notes ->
                    ApiResult.success(notes)
                } ?: ApiResult.success(emptyList())
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to fetch notes",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun createNote(clientId: String, request: CreateNoteRequest): ApiResult<MeetingNote> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.createNote(clientId, request)
            if (response.isSuccessful) {
                response.body()?.let { note ->
                    ApiResult.success(note)
                } ?: ApiResult.error("Empty response")
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to create note",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }

    suspend fun deleteNote(clientId: String, noteId: String): ApiResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteNote(clientId, noteId)
            if (response.isSuccessful) {
                ApiResult.success(Unit)
            } else {
                ApiResult.error(
                    response.errorBody()?.string() ?: "Failed to delete note",
                    response.code()
                )
            }
        } catch (e: Exception) {
            ApiResult.error(e.message ?: "Network error", exception = e)
        }
    }
}
