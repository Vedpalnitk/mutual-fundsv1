import SwiftUI

struct AuthFlow: View {
    @State private var currentStep: AuthStep = .login

    enum AuthStep {
        case login
        case otp
        case signup
    }

    var body: some View {
        NavigationStack {
            switch currentStep {
            case .login:
                LoginView(onOTPSent: { currentStep = .otp })
            case .otp:
                OTPVerifyView(onVerified: { currentStep = .signup })
            case .signup:
                SignupView()
            }
        }
    }
}

// MARK: - Login View
struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    let onOTPSent: () -> Void
    @State private var phoneNumber = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 8) {
                Text("Enter your phone number")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.textPrimary)

                Text("We'll send you a verification code")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("PHONE NUMBER")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(AppTheme.primary)
                    .tracking(1)

                HStack {
                    Text("+91")
                        .foregroundColor(AppTheme.textPrimary)
                        .padding(.leading, 16)

                    TextField("98765 43210", text: $phoneNumber)
                        .keyboardType(.phonePad)
                        .padding(.vertical, 16)
                }
                .background(AppTheme.inputBackground)
                .cornerRadius(12)
            }
            .padding(.horizontal, 24)

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(AppTheme.error)
                    .padding(.horizontal, 24)
            }

            Spacer()

            Button(action: sendOTP) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Send OTP")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(phoneNumber.count >= 10 ? AppTheme.primaryGradient : LinearGradient(colors: [AppTheme.textTertiary], startPoint: .leading, endPoint: .trailing))
            .foregroundColor(.white)
            .cornerRadius(12)
            .disabled(phoneNumber.count < 10 || isLoading)
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sendOTP() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authManager.login(phone: phoneNumber)
                onOTPSent()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - OTP Verify View
struct OTPVerifyView: View {
    @EnvironmentObject var authManager: AuthManager
    let onVerified: () -> Void
    @State private var otp = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @FocusState private var isOTPFocused: Bool

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 8) {
                Text("Enter verification code")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.textPrimary)

                Text("We sent a 6-digit code to your phone")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }

            // OTP Input
            HStack(spacing: 12) {
                ForEach(0..<6, id: \.self) { index in
                    OTPDigitBox(
                        digit: index < otp.count ? String(otp[otp.index(otp.startIndex, offsetBy: index)]) : ""
                    )
                }
            }
            .onTapGesture {
                isOTPFocused = true
            }

            // Hidden text field for OTP input
            TextField("", text: $otp)
                .keyboardType(.numberPad)
                .focused($isOTPFocused)
                .opacity(0)
                .frame(height: 0)
                .onChange(of: otp) { _, newValue in
                    if newValue.count > 6 {
                        otp = String(newValue.prefix(6))
                    }
                    if newValue.count == 6 {
                        verifyOTP()
                    }
                }

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundColor(AppTheme.error)
            }

            // Resend
            Button(action: {}) {
                Text("Didn't receive code? ")
                    .foregroundColor(AppTheme.textSecondary)
                +
                Text("Resend")
                    .foregroundColor(AppTheme.primary)
                    .fontWeight(.semibold)
            }
            .font(.subheadline)

            Spacer()

            Button(action: verifyOTP) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Verify")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(otp.count == 6 ? AppTheme.primaryGradient : LinearGradient(colors: [AppTheme.textTertiary], startPoint: .leading, endPoint: .trailing))
            .foregroundColor(.white)
            .cornerRadius(12)
            .disabled(otp.count != 6 || isLoading)
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
        .onAppear { isOTPFocused = true }
    }

    private func verifyOTP() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authManager.verifyOTP(otp: otp)
                onVerified()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct OTPDigitBox: View {
    let digit: String

    var body: some View {
        Text(digit)
            .font(.title)
            .fontWeight(.bold)
            .foregroundColor(AppTheme.textPrimary)
            .frame(width: 48, height: 56)
            .background(AppTheme.inputBackground)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(digit.isEmpty ? AppTheme.cardBorder : AppTheme.primary, lineWidth: 1)
            )
    }
}

// MARK: - Signup View
struct SignupView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Complete your profile")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(AppTheme.textPrimary)

                Text("Just a few more details to get started")
                    .font(.subheadline)
                    .foregroundColor(AppTheme.textSecondary)
            }
            .padding(.top, 40)

            VStack(spacing: 16) {
                FormField(label: "FIRST NAME", text: $firstName)
                FormField(label: "LAST NAME", text: $lastName)
                FormField(label: "EMAIL", text: $email, keyboardType: .emailAddress)
            }
            .padding(.horizontal, 24)

            Spacer()

            Button(action: completeSignup) {
                Text("Continue")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(AppTheme.primaryGradient)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
    }

    private func completeSignup() {
        // In real app, would update user profile
        authManager.completeOnboarding()
    }
}

struct FormField: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(AppTheme.primary)
                .tracking(1)

            TextField("", text: $text)
                .keyboardType(keyboardType)
                .padding()
                .background(AppTheme.inputBackground)
                .cornerRadius(12)
                .foregroundColor(AppTheme.textPrimary)
        }
    }
}

#Preview {
    AuthFlow()
        .environmentObject(AuthManager())
}
