//
//  AdvisorDetailView.swift
//  SparrowInvest
//
//  Created by Claude on 2025.
//

import SwiftUI

struct AdvisorDetailView: View {
    @EnvironmentObject var advisorStore: AdvisorStore
    let advisor: Advisor

    @State private var showCallbackForm = false
    @State private var showSuccessAlert = false
    @State private var preferredTime: Date = Date()
    @State private var usePreferredTime = false
    @State private var notes: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: AppTheme.Spacing.large) {
                // Profile Header
                ProfileHeaderSection(advisor: advisor)

                // Contact Info
                ContactInfoSection(advisor: advisor)

                // Specializations
                SpecializationsSection(specializations: advisor.specializations)

                // Reviews & Experience
                StatsSection(advisor: advisor)

                // Languages
                LanguagesSection(languages: advisor.languages)

                // Callback Request Button
                if !advisorStore.hasActiveRequest(forAdvisorId: advisor.id) {
                    CallbackButton(action: { showCallbackForm = true })
                } else {
                    PendingRequestBanner()
                }
            }
            .padding(AppTheme.Spacing.medium)
        }
        .background(AppTheme.groupedBackground)
        .navigationTitle("Advisor Profile")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showCallbackForm) {
            CallbackRequestSheet(
                advisor: advisor,
                preferredTime: $preferredTime,
                usePreferredTime: $usePreferredTime,
                notes: $notes,
                onSubmit: submitCallbackRequest,
                onCancel: { showCallbackForm = false }
            )
        }
        .alert("Request Submitted", isPresented: $showSuccessAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Your callback request has been submitted. \(advisor.name) will contact you soon.")
        }
    }

    private func submitCallbackRequest() {
        advisorStore.submitCallbackRequest(
            advisorId: advisor.id,
            preferredTime: usePreferredTime ? preferredTime : nil,
            notes: notes.isEmpty ? nil : notes
        )
        showCallbackForm = false
        showSuccessAlert = true

        // Reset form
        preferredTime = Date()
        usePreferredTime = false
        notes = ""
    }
}

// MARK: - Profile Header Section

private struct ProfileHeaderSection: View {
    let advisor: Advisor
    @Environment(\.colorScheme) private var colorScheme

    private var sectionShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            // Avatar
            ZStack {
                Circle()
                    .fill(AppTheme.primaryGradient)
                    .frame(width: 80, height: 80)

                Text(advisor.initials)
                    .font(.system(size: 22, weight: .regular))
                    .fontWeight(.medium)
                    .foregroundStyle(.white)

                // Availability indicator
                if advisor.isAvailable {
                    Circle()
                        .fill(.green)
                        .frame(width: 16, height: 16)
                        .overlay(
                            Circle()
                                .stroke(.white, lineWidth: 2)
                        )
                        .offset(x: 28, y: 28)
                }
            }

            // Name
            Text(advisor.name)
                .font(.system(size: 22, weight: .regular))
                .foregroundStyle(.primary)

            // Region badge
            Text(advisor.region)
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(AppTheme.primary)
                .padding(.horizontal, AppTheme.Spacing.compact)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(AppTheme.primary.opacity(colorScheme == .dark ? 0.15 : 0.1))
                )

            // Availability text
            HStack(spacing: 4) {
                Circle()
                    .fill(advisor.isAvailable ? .green : .gray)
                    .frame(width: 8, height: 8)

                Text(advisor.isAvailable ? "Available" : "Currently Unavailable")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(advisor.isAvailable ? .green : Color(uiColor: .tertiaryLabel))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.large)
        .background(sectionBackground)
        .overlay(sectionBorder)
        .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.large, style: .continuous)
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Contact Info Section

private struct ContactInfoSection: View {
    let advisor: Advisor
    @Environment(\.colorScheme) private var colorScheme

    private var sectionShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("Contact Information")
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(.primary)

            VStack(spacing: AppTheme.Spacing.compact) {
                ContactRow(icon: "phone.fill", label: "Phone", value: advisor.phone)
                Divider()
                ContactRow(icon: "envelope.fill", label: "Email", value: advisor.email)
            }
            .padding(AppTheme.Spacing.medium)
            .background(sectionBackground)
            .overlay(sectionBorder)
            .shadow(color: sectionShadow, radius: 12, x: 0, y: 4)
        }
    }

    @ViewBuilder
    private var sectionBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var sectionBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

private struct ContactRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(AppTheme.primary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Color(uiColor: .tertiaryLabel))

                Text(value)
                    .font(.system(size: 14, weight: .light))
                    .foregroundStyle(.primary)
            }

            Spacer()
        }
    }
}

// MARK: - Specializations Section

private struct SpecializationsSection: View {
    let specializations: [AdvisorSpecialization]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("Specializations")
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(.primary)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: AppTheme.Spacing.compact) {
                ForEach(specializations, id: \.self) { spec in
                    HStack(spacing: AppTheme.Spacing.small) {
                        Image(systemName: spec.icon)
                            .font(.system(size: 16))
                            .foregroundStyle(spec.color)

                        Text(spec.displayName)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundStyle(.primary)

                        Spacer()
                    }
                    .padding(AppTheme.Spacing.compact)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                            .fill(spec.color.opacity(0.1))
                    )
                }
            }
        }
    }
}

// MARK: - Stats Section

private struct StatsSection: View {
    let advisor: Advisor

    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            StatTile(
                icon: "star.fill",
                iconColor: .orange,
                value: String(format: "%.1f", advisor.rating),
                label: "\(advisor.reviewCount) reviews"
            )

            StatTile(
                icon: "briefcase.fill",
                iconColor: .blue,
                value: "\(advisor.experienceYears)",
                label: "years exp"
            )
        }
    }
}

private struct StatTile: View {
    let icon: String
    let iconColor: Color
    let value: String
    let label: String
    @Environment(\.colorScheme) private var colorScheme

    private var tileShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(iconColor)

            Text(value)
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(.primary)

            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Color(uiColor: .tertiaryLabel))
        }
        .frame(maxWidth: .infinity)
        .padding(AppTheme.Spacing.medium)
        .background(tileBackground)
        .overlay(tileBorder)
        .shadow(color: tileShadow, radius: 12, x: 0, y: 4)
    }

    @ViewBuilder
    private var tileBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var tileBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

// MARK: - Languages Section

private struct LanguagesSection: View {
    let languages: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
            Text("Languages")
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(.primary)

            HStack(spacing: AppTheme.Spacing.small) {
                ForEach(languages, id: \.self) { language in
                    Text(language)
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.primary)
                        .padding(.horizontal, AppTheme.Spacing.compact)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(AppTheme.secondaryFill)
                        )
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Callback Button

private struct CallbackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: AppTheme.Spacing.small) {
                Image(systemName: "phone.arrow.up.right.fill")
                    .font(.system(size: 18))

                Text("Request Callback")
                    .font(.system(size: 14, weight: .light))
                    .fontWeight(.medium)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, AppTheme.Spacing.medium)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                    .fill(AppTheme.primaryGradient)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Pending Request Banner

private struct PendingRequestBanner: View {
    var body: some View {
        HStack(spacing: AppTheme.Spacing.compact) {
            Image(systemName: "clock.fill")
                .foregroundStyle(.orange)

            Text("Callback request pending")
                .font(.system(size: 14, weight: .light))
                .foregroundStyle(.primary)

            Spacer()
        }
        .padding(AppTheme.Spacing.medium)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(.orange.opacity(0.1))
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .stroke(.orange.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Callback Request Sheet

private struct CallbackRequestSheet: View {
    let advisor: Advisor
    @Binding var preferredTime: Date
    @Binding var usePreferredTime: Bool
    @Binding var notes: String
    let onSubmit: () -> Void
    let onCancel: () -> Void
    @Environment(\.colorScheme) private var colorScheme

    private var tileShadow: Color {
        colorScheme == .dark ? Color.clear : Color.black.opacity(0.08)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: AppTheme.Spacing.large) {
                // Advisor info
                HStack(spacing: AppTheme.Spacing.compact) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.primaryGradient)
                            .frame(width: 48, height: 48)

                        Text(advisor.initials)
                            .font(.system(size: 14, weight: .light))
                            .fontWeight(.medium)
                            .foregroundStyle(.white)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(advisor.name)
                            .font(.system(size: 14, weight: .light))
                            .fontWeight(.medium)
                            .foregroundStyle(.primary)

                        Text(advisor.region)
                            .font(.system(size: 12, weight: .regular))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()
                }
                .padding(AppTheme.Spacing.medium)
                .background(tileBackground)
                .overlay(tileBorder)
                .shadow(color: tileShadow, radius: 12, x: 0, y: 4)

                // Preferred time toggle
                VStack(alignment: .leading, spacing: AppTheme.Spacing.compact) {
                    Toggle(isOn: $usePreferredTime) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Preferred Time")
                                .font(.system(size: 14, weight: .light))
                                .foregroundStyle(.primary)

                            Text("Optional - set a preferred callback time")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(Color(uiColor: .tertiaryLabel))
                        }
                    }
                    .tint(AppTheme.primary)

                    if usePreferredTime {
                        DatePicker(
                            "Select time",
                            selection: $preferredTime,
                            in: Date()...,
                            displayedComponents: [.date, .hourAndMinute]
                        )
                        .datePickerStyle(.graphical)
                        .labelsHidden()
                    }
                }
                .padding(AppTheme.Spacing.medium)
                .background(tileBackground)
                .overlay(tileBorder)
                .shadow(color: tileShadow, radius: 12, x: 0, y: 4)

                // Notes field
                VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                    Text("Notes (Optional)")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(.secondary)

                    TextField("Add any specific topics you'd like to discuss...", text: $notes, axis: .vertical)
                        .font(.system(size: 14, weight: .light))
                        .lineLimit(3...6)
                        .textFieldStyle(.plain)
                        .padding(AppTheme.Spacing.compact)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.small, style: .continuous)
                                .fill(AppTheme.secondaryFill)
                        )
                }

                Spacer()

                // Submit button
                Button(action: onSubmit) {
                    Text("Submit Request")
                        .font(.system(size: 14, weight: .light))
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, AppTheme.Spacing.medium)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                                .fill(AppTheme.primaryGradient)
                        )
                }
                .buttonStyle(.plain)
            }
            .padding(AppTheme.Spacing.medium)
            .background(AppTheme.groupedBackground)
            .navigationTitle("Request Callback")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder
    private var tileBackground: some View {
        if colorScheme == .dark {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color.black.opacity(0.4))
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                        .fill(.ultraThinMaterial)
                )
        } else {
            RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
                .fill(Color(uiColor: .white))
        }
    }

    private var tileBorder: some View {
        RoundedRectangle(cornerRadius: AppTheme.CornerRadius.medium, style: .continuous)
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
                            .init(color: .black.opacity(0.1), location: 0),
                            .init(color: .black.opacity(0.05), location: 0.3),
                            .init(color: .black.opacity(0.03), location: 0.7),
                            .init(color: .black.opacity(0.07), location: 1)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                      ),
                lineWidth: 1
            )
    }
}

#Preview {
    NavigationStack {
        AdvisorDetailView(
            advisor: Advisor(
                id: "1",
                name: "Rajesh Sharma",
                photo: nil,
                region: "Mumbai",
                phone: "+91 98765 43210",
                email: "rajesh@test.com",
                specializations: [.retirement, .taxPlanning, .hni],
                experienceYears: 15,
                rating: 4.9,
                reviewCount: 156,
                languages: ["Hindi", "English", "Marathi"],
                isAvailable: true
            )
        )
        .environmentObject(AdvisorStore())
    }
}
