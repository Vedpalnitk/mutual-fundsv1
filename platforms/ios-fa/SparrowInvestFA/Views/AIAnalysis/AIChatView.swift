//
//  AIChatView.swift
//  SparrowInvestFA
//
//  Avya - AI Chat interface for Financial Advisors (text-only)
//

import SwiftUI

// MARK: - Spacing & Corner Radius Constants

private enum ChatSpacing {
    static let small: CGFloat = 8
    static let compact: CGFloat = 12
    static let medium: CGFloat = 16
    static let large: CGFloat = 20
}

private enum ChatCornerRadius {
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let xLarge: CGFloat = 20
}

// MARK: - AI Chat View

struct AIChatView: View {
    var initialQuery: String? = nil

    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @StateObject private var chatStore = AvyaChatStore()

    @State private var messageText = ""
    @State private var hasProcessedInitialQuery = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Chat Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: ChatSpacing.medium) {
                            // Welcome Message
                            if chatStore.messages.isEmpty {
                                WelcomeCard(onQuestionTap: { question in
                                    messageText = question
                                    sendMessage()
                                })
                                    .padding(.top, ChatSpacing.large)
                            }

                            // Messages
                            ForEach(chatStore.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }

                            // Typing Indicator
                            if chatStore.isProcessing {
                                TypingIndicator()
                                    .id("typing")
                            }
                        }
                        .padding(.horizontal, ChatSpacing.medium)
                        .padding(.bottom, ChatSpacing.medium)
                    }
                    .onChange(of: chatStore.messages.count) { _, _ in
                        withAnimation {
                            if let lastMessage = chatStore.messages.last {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                    .onChange(of: chatStore.isProcessing) { _, newValue in
                        if newValue {
                            withAnimation {
                                proxy.scrollTo("typing", anchor: .bottom)
                            }
                        }
                    }
                }

                // Input Area
                ChatInputBar(
                    messageText: $messageText,
                    isProcessing: chatStore.isProcessing,
                    onSend: sendMessage
                )
            }
            .background(AppTheme.groupedBackground)
            .navigationTitle("Avya")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 14))
                            .foregroundColor(.primary)
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: clearChat) {
                            Label("Clear Chat", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.system(size: 16))
                            .foregroundColor(.primary)
                    }
                }
            }
            .alert("Error", isPresented: Binding(
                get: { chatStore.errorMessage != nil },
                set: { if !$0 { chatStore.errorMessage = nil } }
            )) {
                Button("OK") {
                    chatStore.errorMessage = nil
                }
            } message: {
                Text(chatStore.errorMessage ?? "")
            }
            .onAppear {
                if let query = initialQuery, !query.isEmpty, !hasProcessedInitialQuery {
                    hasProcessedInitialQuery = true
                    messageText = query
                    sendMessage()
                }
            }
        }
    }

    // MARK: - Actions

    private func sendMessage() {
        guard !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        let content = messageText
        messageText = ""
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)

        Task {
            try? await chatStore.sendMessage(content)
        }
    }

    private func clearChat() {
        withAnimation {
            chatStore.clearMessages()
        }
    }
}

// MARK: - Welcome Card

struct WelcomeCard: View {
    @Environment(\.colorScheme) private var colorScheme
    let onQuestionTap: (String) -> Void

    let suggestedQuestions = [
        "Give me an overview of my client book",
        "Which clients need portfolio rebalancing?",
        "How is Priya Patel's portfolio doing?",
        "Any goals at risk this quarter?"
    ]

    var body: some View {
        VStack(spacing: ChatSpacing.large) {
            // Avya Avatar
            ZStack {
                Circle()
                    .fill(
                        AppTheme.avyaGradient
                    )
                    .frame(width: 72, height: 72)

                Image(systemName: "sparkles")
                    .font(.system(size: 32))
                    .foregroundColor(.white)
            }

            VStack(spacing: ChatSpacing.small) {
                Text("Avya")
                    .font(AppTheme.Typography.numeric(20))
                    .foregroundColor(.primary)

                Text("Your intelligent advisor assistant")
                    .font(AppTheme.Typography.caption())
                    .foregroundColor(.secondary)
            }

            // Suggested Questions
            VStack(alignment: .leading, spacing: ChatSpacing.compact) {
                Text("TRY ASKING")
                    .font(AppTheme.Typography.label(11))
                    .foregroundColor(.blue)

                ForEach(suggestedQuestions, id: \.self) { question in
                    SuggestedQuestionChip(question: question, onTap: {
                        onQuestionTap(question)
                    })
                }
            }
        }
        .padding(ChatSpacing.large)
        .background(cardBackground)
        .overlay(cardBorder)
        .shadow(color: cardShadow, radius: 12, x: 0, y: 4)
    }

    private var cardShadow: Color {
        colorScheme == .dark ? .clear : .black.opacity(0.08)
    }

    @ViewBuilder
    private var cardBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: ChatCornerRadius.xLarge, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: ChatCornerRadius.xLarge, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: ChatCornerRadius.xLarge, style: .continuous)
                .fill(Color.white)
        }
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: ChatCornerRadius.xLarge, style: .continuous)
            .stroke(
                colorScheme == .dark
                    ? LinearGradient(
                        stops: [
                            .init(color: .white.opacity(0.4), location: 0),
                            .init(color: .white.opacity(0.15), location: 0.3),
                            .init(color: .white.opacity(0.05), location: 0.7),
                            .init(color: .white.opacity(0.1), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      )
                    : LinearGradient(
                        stops: [
                            .init(color: .black.opacity(0.08), location: 0),
                            .init(color: .black.opacity(0.04), location: 0.3),
                            .init(color: .black.opacity(0.02), location: 0.7),
                            .init(color: .black.opacity(0.06), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Suggested Question Chip

struct SuggestedQuestionChip: View {
    let question: String
    let onTap: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Button {
            onTap()
        } label: {
            HStack(spacing: ChatSpacing.small) {
                Image(systemName: "sparkles")
                    .font(.system(size: 12))
                    .foregroundColor(.blue)

                Text(question)
                    .font(AppTheme.Typography.caption(13))
                    .foregroundColor(.primary)

                Spacer()

                Image(systemName: "arrow.right")
                    .font(.system(size: 10))
                    .foregroundColor(Color(UIColor.tertiaryLabel))
            }
            .padding(.horizontal, ChatSpacing.compact)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
            .background(
                colorScheme == .dark
                    ? Color.white.opacity(0.06)
                    : Color(UIColor.tertiarySystemFill),
                in: RoundedRectangle(cornerRadius: ChatCornerRadius.medium, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Chat Bubble

struct ChatBubble: View {
    let message: AvyaChatMessage
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(alignment: .bottom, spacing: ChatSpacing.small) {
            if message.isUser {
                Spacer(minLength: 60)
            } else {
                // AI Avatar
                ZStack {
                    Circle()
                        .fill(
                            AppTheme.avyaBubbleGradient
                        )
                        .frame(width: 28, height: 28)

                    Image(systemName: "sparkles")
                        .font(.system(size: 12))
                        .foregroundColor(.white)
                }
            }

            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(AppTheme.Typography.body(15))
                    .foregroundColor(message.isUser ? .white : .primary)
                    .padding(.horizontal, ChatSpacing.medium)
                    .padding(.vertical, ChatSpacing.compact)
                    .background(bubbleBackground)

                Text(formatTime(message.timestamp))
                    .font(AppTheme.Typography.label(10))
                    .foregroundColor(Color(UIColor.tertiaryLabel))
            }

            if !message.isUser {
                Spacer(minLength: 60)
            }
        }
    }

    @ViewBuilder
    private var bubbleBackground: some View {
        if message.isUser {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(
                    AppTheme.avyaBubbleGradient
                )
        } else {
            if colorScheme == .dark {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white.opacity(0.1))
            } else {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
            }
        }
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: View {
    @State private var animationPhase = 0
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(alignment: .bottom, spacing: ChatSpacing.small) {
            // AI Avatar
            ZStack {
                Circle()
                    .fill(
                        AppTheme.avyaBubbleGradient
                    )
                    .frame(width: 28, height: 28)

                Image(systemName: "sparkles")
                    .font(.system(size: 12))
                    .foregroundColor(.white)
            }

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 8, height: 8)
                        .scaleEffect(animationPhase == index ? 1.2 : 0.8)
                        .opacity(animationPhase == index ? 1 : 0.5)
                }
            }
            .padding(.horizontal, ChatSpacing.medium)
            .padding(.vertical, ChatSpacing.compact)
            .background(typingBackground)

            Spacer()
        }
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                withAnimation(.easeInOut(duration: 0.2)) {
                    animationPhase = (animationPhase + 1) % 3
                }
            }
        }
    }

    @ViewBuilder
    private var typingBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white.opacity(0.1))
        } else {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 2)
        }
    }
}

// MARK: - Chat Input Bar

struct ChatInputBar: View {
    @Binding var messageText: String
    var isProcessing: Bool
    let onSend: () -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: ChatSpacing.compact) {
                // Text Input
                TextField("Ask Avya...", text: $messageText, axis: .vertical)
                    .font(AppTheme.Typography.body(15))
                    .lineLimit(1...4)
                    .textFieldStyle(.plain)
                    .disabled(isProcessing)
                    .submitLabel(.send)
                    .onSubmit { onSend() }
                    .padding(.horizontal, ChatSpacing.medium)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .fill(colorScheme == .dark ? Color.white.opacity(0.06) : Color(UIColor.tertiarySystemFill))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(
                                colorScheme == .dark ? Color.white.opacity(0.1) : Color.black.opacity(0.05),
                                lineWidth: 1
                            )
                            .allowsHitTesting(false)
                    )

                // Send Button
                Button(action: onSend) {
                    ZStack {
                        Circle()
                            .fill(
                                messageText.isEmpty || isProcessing
                                    ? AnyShapeStyle(Color.gray.opacity(0.3))
                                    : AnyShapeStyle(AppTheme.avyaBubbleGradient)
                            )
                            .frame(width: 40, height: 40)

                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 16))
                                .foregroundColor(messageText.isEmpty ? .gray : .white)
                        }
                    }
                }
                .disabled(messageText.isEmpty || isProcessing)
            }
            .padding(.horizontal, ChatSpacing.medium)
            .padding(.vertical, ChatSpacing.compact)
            .background(colorScheme == .dark ? AppTheme.background : Color.white)
        }
    }
}

// MARK: - Preview

#Preview {
    AIChatView()
}
