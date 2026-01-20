import SwiftUI

struct AuthFlow: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var currentStep: AuthStep = .login
    @State private var loginMethod: LoginMethod = .phone
    @State private var resetMethod: ResetMethod = .email
    @State private var pendingPhone: String = ""
    @State private var pendingEmail: String = ""

    enum AuthStep {
        case login
        case otp
        case forgotPassword
        case resetOTP
        case newPassword
        case signup
    }

    enum LoginMethod {
        case phone
        case email
    }

    enum ResetMethod {
        case email
        case phone
    }

    var body: some View {
        NavigationStack {
            switch currentStep {
            case .login:
                LoginView(
                    loginMethod: $loginMethod,
                    onOTPSent: { phone in
                        pendingPhone = phone
                        currentStep = .otp
                    },
                    onEmailLogin: {
                        currentStep = .signup
                    },
                    onForgotPassword: {
                        currentStep = .forgotPassword
                    },
                    onSkip: { authManager.continueAsGuest() }
                )
            case .otp:
                OTPVerifyView(
                    phone: pendingPhone,
                    onVerified: { currentStep = .signup },
                    onSkip: { authManager.continueAsGuest() },
                    onBack: { currentStep = .login }
                )
            case .forgotPassword:
                ForgotPasswordView(
                    resetMethod: $resetMethod,
                    onOTPSent: { identifier in
                        if resetMethod == .phone {
                            pendingPhone = identifier
                        } else {
                            pendingEmail = identifier
                        }
                        currentStep = .resetOTP
                    },
                    onBack: { currentStep = .login }
                )
            case .resetOTP:
                ResetOTPVerifyView(
                    resetMethod: resetMethod,
                    identifier: resetMethod == .phone ? pendingPhone : pendingEmail,
                    onVerified: { currentStep = .newPassword },
                    onBack: { currentStep = .forgotPassword }
                )
            case .newPassword:
                NewPasswordView(
                    onPasswordReset: { currentStep = .login },
                    onBack: { currentStep = .forgotPassword }
                )
            case .signup:
                SignupView(
                    onSkip: { authManager.continueAsGuest() }
                )
            }
        }
    }
}

// MARK: - Login View
struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme
    @Binding var loginMethod: AuthFlow.LoginMethod
    let onOTPSent: (String) -> Void
    let onEmailLogin: () -> Void
    let onForgotPassword: () -> Void
    let onSkip: () -> Void

    @State private var phoneNumber = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var isPasswordVisible = false

    var body: some View {
        VStack(spacing: 0) {
            // Skip button
            HStack {
                Spacer()
                Button(action: onSkip) {
                    Text("Skip")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(.trailing, 24)
            }
            .padding(.top, 16)

            Spacer()

            // Logo
            HStack(spacing: 8) {
                Image(systemName: "bird.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(AppTheme.primaryGradient)
                Text("Sparrow Invest")
                    .font(.system(size: 24, weight: .regular))
                    .foregroundColor(.primary)
            }
            .padding(.bottom, 40)

            VStack(spacing: 8) {
                Text("Welcome back")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("Sign in to continue")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // Login Method Toggle
            loginMethodToggle
                .padding(.top, 24)

            // Form Fields
            if loginMethod == .phone {
                phoneLoginFields
            } else {
                emailLoginFields
            }

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.red)
                    .padding(.horizontal, 24)
                    .padding(.top, 12)
            }

            Spacer()

            // Action Buttons
            VStack(spacing: 16) {
                Button(action: performLogin) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text(loginMethod == .phone ? "Send OTP" : "Sign In")
                            .font(.system(size: 17, weight: .medium))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isFormValid ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(!isFormValid || isLoading)

                Button(action: onSkip) {
                    Text("Continue without login")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var isFormValid: Bool {
        if loginMethod == .phone {
            return phoneNumber.count >= 10
        } else {
            return !email.isEmpty && !password.isEmpty && email.contains("@")
        }
    }

    private var loginMethodToggle: some View {
        HStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    loginMethod = .phone
                    errorMessage = nil
                }
            } label: {
                Text("Phone")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(loginMethod == .phone ? .white : .primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        if loginMethod == .phone {
                            Capsule().fill(Color.blue)
                        }
                    }
            }

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    loginMethod = .email
                    errorMessage = nil
                }
            } label: {
                Text("Email")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(loginMethod == .email ? .white : .primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        if loginMethod == .email {
                            Capsule().fill(Color.blue)
                        }
                    }
            }
        }
        .padding(4)
        .background(toggleBackground)
        .overlay(toggleBorder)
        .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
        .padding(.horizontal, 24)
    }

    @ViewBuilder
    private var toggleBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var toggleBorder: some View {
        Capsule()
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private var phoneLoginFields: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PHONE NUMBER")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            HStack {
                Text("+91")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                    .padding(.leading, 16)

                TextField("98765 43210", text: $phoneNumber)
                    .font(.system(size: 14, weight: .light))
                    .keyboardType(.phonePad)
                    .padding(.vertical, 16)
            }
            .background(inputBackground)
            .overlay(inputBorder)
            .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
    }

    private var emailLoginFields: some View {
        VStack(spacing: 16) {
            // Email Field
            VStack(alignment: .leading, spacing: 8) {
                Text("EMAIL OR USERNAME")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                TextField("Enter your email", text: $email)
                    .font(.system(size: 14, weight: .light))
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .padding()
                    .background(inputBackground)
                    .overlay(inputBorder)
                    .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
            }

            // Password Field
            VStack(alignment: .leading, spacing: 8) {
                Text("PASSWORD")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.blue)
                    .tracking(1)

                HStack {
                    if isPasswordVisible {
                        TextField("Enter your password", text: $password)
                            .font(.system(size: 14, weight: .light))
                            .textContentType(.password)
                    } else {
                        SecureField("Enter your password", text: $password)
                            .font(.system(size: 14, weight: .light))
                            .textContentType(.password)
                    }

                    Button {
                        isPasswordVisible.toggle()
                    } label: {
                        Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                            .font(.system(size: 16))
                            .foregroundColor(Color(uiColor: .tertiaryLabel))
                    }
                }
                .padding()
                .background(inputBackground)
                .overlay(inputBorder)
                .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)

                // Forgot Password Link
                HStack {
                    Spacer()
                    Button(action: onForgotPassword) {
                        Text("Forgot Password?")
                            .font(.system(size: 12, weight: .regular))
                            .foregroundColor(.blue)
                    }
                }
                .padding(.top, 4)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
    }

    @ViewBuilder
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private func performLogin() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                if loginMethod == .phone {
                    try await authManager.login(phone: phoneNumber)
                    onOTPSent(phoneNumber)
                } else {
                    try await authManager.loginWithEmail(email: email, password: password)
                    onEmailLogin()
                }
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
    @Environment(\.colorScheme) private var colorScheme
    let phone: String
    let onVerified: () -> Void
    let onSkip: () -> Void
    let onBack: () -> Void

    @State private var otp = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @FocusState private var isOTPFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Header with back and skip
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.leading, 24)

                Spacer()

                Button(action: onSkip) {
                    Text("Skip")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(.trailing, 24)
            }
            .padding(.top, 16)

            Spacer()

            VStack(spacing: 8) {
                Text("Enter verification code")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("We sent a 6-digit code to +91 \(phone)")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }

            // OTP Input
            HStack(spacing: 10) {
                ForEach(0..<6, id: \.self) { index in
                    OTPDigitBox(
                        digit: index < otp.count ? String(otp[otp.index(otp.startIndex, offsetBy: index)]) : ""
                    )
                }
            }
            .padding(.top, 32)
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
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.red)
                    .padding(.top, 12)
            }

            // Resend
            Button(action: {}) {
                Text("Didn't receive code? ")
                    .foregroundColor(.secondary)
                +
                Text("Resend")
                    .foregroundColor(.blue)
                    .font(.system(size: 12, weight: .medium))
            }
            .font(.system(size: 12, weight: .regular))
            .padding(.top, 20)

            Spacer()

            VStack(spacing: 16) {
                Button(action: verifyOTP) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Verify")
                            .font(.system(size: 17, weight: .medium))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(otp.count == 6 ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(otp.count != 6 || isLoading)

                Button(action: onSkip) {
                    Text("Continue without login")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.secondary)
                }
            }
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

// MARK: - Forgot Password View
struct ForgotPasswordView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme
    @Binding var resetMethod: AuthFlow.ResetMethod
    let onOTPSent: (String) -> Void
    let onBack: () -> Void

    @State private var email = ""
    @State private var phoneNumber = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Back button
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.leading, 24)
                Spacer()
            }
            .padding(.top, 16)

            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(Color.orange.opacity(0.15))
                    .frame(width: 80, height: 80)
                Image(systemName: "key.fill")
                    .font(.system(size: 32))
                    .foregroundColor(.orange)
            }
            .padding(.bottom, 24)

            VStack(spacing: 8) {
                Text("Forgot Password?")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("No worries, we'll send you reset instructions")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Reset Method Toggle
            resetMethodToggle
                .padding(.top, 24)

            // Form Fields
            if resetMethod == .email {
                emailResetField
            } else {
                phoneResetField
            }

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.red)
                    .padding(.horizontal, 24)
                    .padding(.top, 12)
            }

            Spacer()

            // Action Button
            VStack(spacing: 16) {
                Button(action: sendResetOTP) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Send OTP")
                            .font(.system(size: 17, weight: .medium))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isFormValid ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(!isFormValid || isLoading)

                Button(action: onBack) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.left")
                            .font(.system(size: 12))
                        Text("Back to login")
                    }
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .background(AppTheme.background)
    }

    private var isFormValid: Bool {
        if resetMethod == .email {
            return !email.isEmpty && email.contains("@")
        } else {
            return phoneNumber.count >= 10
        }
    }

    private var resetMethodToggle: some View {
        HStack(spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    resetMethod = .email
                    errorMessage = nil
                }
            } label: {
                Text("Email")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(resetMethod == .email ? .white : .primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        if resetMethod == .email {
                            Capsule().fill(Color.blue)
                        }
                    }
            }

            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    resetMethod = .phone
                    errorMessage = nil
                }
            } label: {
                Text("Phone")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(resetMethod == .phone ? .white : .primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background {
                        if resetMethod == .phone {
                            Capsule().fill(Color.blue)
                        }
                    }
            }
        }
        .padding(4)
        .background(toggleBackground)
        .overlay(toggleBorder)
        .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
        .padding(.horizontal, 24)
    }

    @ViewBuilder
    private var toggleBackground: some View {
        if colorScheme == .dark {
            Capsule()
                .fill(Color.black.opacity(0.4))
                .background(Capsule().fill(.ultraThinMaterial))
        } else {
            Capsule().fill(Color.white)
        }
    }

    private var toggleBorder: some View {
        Capsule()
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private var emailResetField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("EMAIL ADDRESS")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            TextField("Enter your email", text: $email)
                .font(.system(size: 14, weight: .light))
                .keyboardType(.emailAddress)
                .textContentType(.emailAddress)
                .autocapitalization(.none)
                .padding()
                .background(inputBackground)
                .overlay(inputBorder)
                .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
    }

    private var phoneResetField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PHONE NUMBER")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            HStack {
                Text("+91")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.primary)
                    .padding(.leading, 16)

                TextField("98765 43210", text: $phoneNumber)
                    .font(.system(size: 14, weight: .light))
                    .keyboardType(.phonePad)
                    .padding(.vertical, 16)
            }
            .background(inputBackground)
            .overlay(inputBorder)
            .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
        }
        .padding(.horizontal, 24)
        .padding(.top, 24)
    }

    @ViewBuilder
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private func sendResetOTP() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let identifier = resetMethod == .email ? email : phoneNumber
                try await authManager.sendPasswordResetOTP(to: identifier, method: resetMethod == .email ? .email : .phone)
                onOTPSent(identifier)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - Reset OTP Verify View
struct ResetOTPVerifyView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme
    let resetMethod: AuthFlow.ResetMethod
    let identifier: String
    let onVerified: () -> Void
    let onBack: () -> Void

    @State private var otp = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @FocusState private var isOTPFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Back button
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.leading, 24)
                Spacer()
            }
            .padding(.top, 16)

            Spacer()

            VStack(spacing: 8) {
                Text("Enter verification code")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("We sent a 6-digit code to \(resetMethod == .phone ? "+91 " : "")\(identifier)")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // OTP Input
            HStack(spacing: 10) {
                ForEach(0..<6, id: \.self) { index in
                    OTPDigitBox(
                        digit: index < otp.count ? String(otp[otp.index(otp.startIndex, offsetBy: index)]) : ""
                    )
                }
            }
            .padding(.top, 32)
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
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.red)
                    .padding(.top, 12)
            }

            // Resend
            Button(action: {}) {
                Text("Didn't receive code? ")
                    .foregroundColor(.secondary)
                +
                Text("Resend")
                    .foregroundColor(.blue)
                    .fontWeight(.medium)
            }
            .font(.system(size: 12, weight: .regular))
            .padding(.top, 20)

            Spacer()

            // Action Button
            Button(action: verifyOTP) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Verify")
                        .font(.system(size: 17, weight: .medium))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(otp.count == 6 ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
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
                try await authManager.verifyPasswordResetOTP(otp: otp)
                onVerified()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

// MARK: - New Password View
struct NewPasswordView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme
    let onPasswordReset: () -> Void
    let onBack: () -> Void

    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var isNewPasswordVisible = false
    @State private var isConfirmPasswordVisible = false
    @State private var showSuccess = false

    private var isFormValid: Bool {
        newPassword.count >= 8 && newPassword == confirmPassword
    }

    var body: some View {
        VStack(spacing: 0) {
            // Back button
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.primary)
                }
                .padding(.leading, 24)
                Spacer()
            }
            .padding(.top, 16)

            Spacer()

            if showSuccess {
                successView
            } else {
                formView
            }

            Spacer()

            // Action Button
            if !showSuccess {
                Button(action: resetPassword) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Reset Password")
                            .font(.system(size: 17, weight: .medium))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(isFormValid ? AppTheme.primaryGradient : LinearGradient(colors: [Color(uiColor: .tertiaryLabel)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(.white)
                .cornerRadius(12)
                .disabled(!isFormValid || isLoading)
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
        .background(AppTheme.background)
    }

    private var formView: some View {
        VStack(spacing: 24) {
            // Icon
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.15))
                    .frame(width: 80, height: 80)
                Image(systemName: "lock.rotation")
                    .font(.system(size: 32))
                    .foregroundColor(.green)
            }

            VStack(spacing: 8) {
                Text("Create new password")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("Your new password must be at least 8 characters")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            VStack(spacing: 16) {
                // New Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("NEW PASSWORD")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)

                    HStack {
                        if isNewPasswordVisible {
                            TextField("Enter new password", text: $newPassword)
                                .font(.system(size: 14, weight: .light))
                        } else {
                            SecureField("Enter new password", text: $newPassword)
                                .font(.system(size: 14, weight: .light))
                        }

                        Button {
                            isNewPasswordVisible.toggle()
                        } label: {
                            Image(systemName: isNewPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                .font(.system(size: 16))
                                .foregroundColor(Color(uiColor: .tertiaryLabel))
                        }
                    }
                    .padding()
                    .background(inputBackground)
                    .overlay(inputBorder)
                    .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
                }

                // Confirm Password Field
                VStack(alignment: .leading, spacing: 8) {
                    Text("CONFIRM PASSWORD")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.blue)
                        .tracking(1)

                    HStack {
                        if isConfirmPasswordVisible {
                            TextField("Confirm new password", text: $confirmPassword)
                                .font(.system(size: 14, weight: .light))
                        } else {
                            SecureField("Confirm new password", text: $confirmPassword)
                                .font(.system(size: 14, weight: .light))
                        }

                        Button {
                            isConfirmPasswordVisible.toggle()
                        } label: {
                            Image(systemName: isConfirmPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                .font(.system(size: 16))
                                .foregroundColor(Color(uiColor: .tertiaryLabel))
                        }
                    }
                    .padding()
                    .background(inputBackground)
                    .overlay(inputBorder)
                    .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)

                    // Password match indicator
                    if !confirmPassword.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: newPassword == confirmPassword ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .font(.system(size: 12))
                            Text(newPassword == confirmPassword ? "Passwords match" : "Passwords don't match")
                                .font(.system(size: 12, weight: .regular))
                        }
                        .foregroundColor(newPassword == confirmPassword ? .green : .red)
                        .padding(.top, 4)
                    }
                }
            }
            .padding(.horizontal, 24)

            if let error = errorMessage {
                Text(error)
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.red)
                    .padding(.horizontal, 24)
            }
        }
    }

    private var successView: some View {
        VStack(spacing: 24) {
            // Success Icon
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.15))
                    .frame(width: 100, height: 100)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.green)
            }

            VStack(spacing: 8) {
                Text("Password Reset!")
                    .font(.system(size: 24, weight: .regular))
                    .foregroundColor(.primary)

                Text("Your password has been successfully reset. You can now sign in with your new password.")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Button(action: onPasswordReset) {
                Text("Back to Login")
                    .font(.system(size: 17, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(AppTheme.primaryGradient)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)
        }
    }

    @ViewBuilder
    private var inputBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
        }
    }

    private var inputBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }

    private func resetPassword() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await authManager.resetPassword(newPassword: newPassword)
                showSuccess = true
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct OTPDigitBox: View {
    let digit: String
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Text(digit)
            .font(.system(size: 24, weight: .regular))
            .foregroundColor(.primary)
            .frame(width: 48, height: 56)
            .background(boxBackground)
            .overlay(boxBorder)
            .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }

    @ViewBuilder
    private var boxBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
        }
    }

    private var boxBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                digit.isEmpty
                    ? (colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.08))
                    : Color.blue,
                lineWidth: digit.isEmpty ? 1 : 2
            )
    }
}

// MARK: - Signup View
struct SignupView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.colorScheme) private var colorScheme
    let onSkip: () -> Void
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""

    var body: some View {
        VStack(spacing: 0) {
            // Skip button
            HStack {
                Spacer()
                Button(action: onSkip) {
                    Text("Skip")
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.secondary)
                }
                .padding(.trailing, 24)
            }
            .padding(.top, 16)

            VStack(spacing: 8) {
                Text("Complete your profile")
                    .font(.system(size: 20, weight: .regular))
                    .foregroundColor(.primary)

                Text("Just a few more details to get started")
                    .font(.system(size: 14, weight: .light))
                    .foregroundColor(.secondary)
            }
            .padding(.top, 24)

            VStack(spacing: 16) {
                FormFieldStyled(label: "FIRST NAME", text: $firstName)
                FormFieldStyled(label: "LAST NAME", text: $lastName)
                FormFieldStyled(label: "EMAIL", text: $email, keyboardType: .emailAddress)
            }
            .padding(.horizontal, 24)
            .padding(.top, 32)

            Spacer()

            VStack(spacing: 16) {
                Button(action: completeSignup) {
                    Text("Continue")
                        .font(.system(size: 17, weight: .medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(AppTheme.primaryGradient)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                Button(action: onSkip) {
                    Text("Skip for now")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(.secondary)
                }
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

struct FormFieldStyled: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.blue)
                .tracking(1)

            TextField("", text: $text)
                .font(.system(size: 14, weight: .light))
                .keyboardType(keyboardType)
                .padding()
                .background(fieldBackground)
                .overlay(fieldBorder)
                .shadow(color: colorScheme == .dark ? .clear : .black.opacity(0.04), radius: 8, x: 0, y: 2)
                .foregroundColor(.primary)
        }
    }

    @ViewBuilder
    private var fieldBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white)
        }
    }

    private var fieldBorder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.3), location: 0),
                            .init(color: .white.opacity(0.1), location: 0.5),
                            .init(color: .white.opacity(0.2), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.5),
                            .init(color: .black.opacity(0.08), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// Keep legacy FormField for compatibility
struct FormField: View {
    let label: String
    @Binding var text: String
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        FormFieldStyled(label: label, text: $text, keyboardType: keyboardType)
    }
}

#Preview {
    AuthFlow()
        .environmentObject(AuthManager())
}
