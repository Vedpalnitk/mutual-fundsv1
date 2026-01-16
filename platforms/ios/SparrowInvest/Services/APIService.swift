import Foundation

class APIService {
    static let shared = APIService()

    private let baseURL: String
    private let session: URLSession

    private init() {
        // Configure base URL based on environment
        #if DEBUG
        self.baseURL = "http://localhost:3501/api/v1"
        #else
        self.baseURL = "https://api.sparrowinvest.com/api/v1"
        #endif

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }

    // MARK: - HTTP Methods

    func get(_ endpoint: String) async throws -> Data {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request = addHeaders(to: request)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return data
    }

    func post(_ endpoint: String, body: Encodable) async throws -> Data {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = try JSONEncoder().encode(body)
        request = addHeaders(to: request)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return data
    }

    func put(_ endpoint: String, body: Encodable) async throws -> Data {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.httpBody = try JSONEncoder().encode(body)
        request = addHeaders(to: request)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return data
    }

    func delete(_ endpoint: String) async throws {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request = addHeaders(to: request)

        let (_, response) = try await session.data(for: request)
        try validateResponse(response)
    }

    // MARK: - Helpers

    private func addHeaders(to request: URLRequest) -> URLRequest {
        var request = request
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add auth token if available
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.unknown(httpResponse.statusCode)
        }
    }

    private func getAuthToken() -> String? {
        // In real app, retrieve from Keychain
        UserDefaults.standard.string(forKey: "authToken")
    }
}

// MARK: - API Errors
enum APIError: LocalizedError {
    case invalidResponse
    case unauthorized
    case notFound
    case serverError
    case unknown(Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .unauthorized:
            return "Please login again"
        case .notFound:
            return "Resource not found"
        case .serverError:
            return "Server error. Please try again later"
        case .unknown(let code):
            return "Error: \(code)"
        }
    }
}
