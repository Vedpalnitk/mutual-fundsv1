package com.sparrowinvest.app.core.network

sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(
        val code: Int? = null,
        val message: String,
        val exception: Throwable? = null
    ) : ApiResult<Nothing>()
    data object Loading : ApiResult<Nothing>()

    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading

    fun getOrNull(): T? = when (this) {
        is Success -> data
        else -> null
    }

    fun <R> map(transform: (T) -> R): ApiResult<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> Error(code, message, exception)
        is Loading -> Loading
    }

    suspend fun <R> flatMap(transform: suspend (T) -> ApiResult<R>): ApiResult<R> = when (this) {
        is Success -> transform(data)
        is Error -> Error(code, message, exception)
        is Loading -> Loading
    }

    companion object {
        fun <T> success(data: T): ApiResult<T> = Success(data)
        fun error(message: String, code: Int? = null, exception: Throwable? = null): ApiResult<Nothing> =
            Error(code, message, exception)
        fun loading(): ApiResult<Nothing> = Loading

        fun unauthorized(message: String = "Unauthorized"): ApiResult<Nothing> =
            Error(401, message)
        fun notFound(message: String = "Not found"): ApiResult<Nothing> =
            Error(404, message)
        fun serverError(message: String = "Server error"): ApiResult<Nothing> =
            Error(500, message)
    }
}

inline fun <T> ApiResult<T>.onSuccess(action: (T) -> Unit): ApiResult<T> {
    if (this is ApiResult.Success) action(data)
    return this
}

inline fun <T> ApiResult<T>.onError(action: (ApiResult.Error) -> Unit): ApiResult<T> {
    if (this is ApiResult.Error) action(this)
    return this
}

inline fun <T> ApiResult<T>.onLoading(action: () -> Unit): ApiResult<T> {
    if (this is ApiResult.Loading) action()
    return this
}
