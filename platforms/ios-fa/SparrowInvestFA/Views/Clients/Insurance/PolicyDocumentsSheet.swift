import SwiftUI
import UniformTypeIdentifiers

struct PolicyDocumentsSheet: View {
    let clientId: String
    let policy: InsurancePolicy
    @ObservedObject var store: InsuranceStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var iPad: Bool { sizeClass == .regular }

    @State private var showFilePicker = false
    @State private var showDeleteConfirm = false
    @State private var docToDelete: PolicyDocument?

    var body: some View {
        NavigationStack {
            Group {
                if store.documents.isEmpty && !store.isUploading {
                    emptyState
                } else {
                    ScrollView {
                        VStack(spacing: AppTheme.Spacing.compact) {
                            if store.isUploading {
                                HStack(spacing: 8) {
                                    ProgressView()
                                    Text("Uploading...")
                                        .font(AppTheme.Typography.body(iPad ? 15 : 13))
                                        .foregroundColor(.secondary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, AppTheme.Spacing.compact)
                                .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
                            }

                            ForEach(store.documents) { doc in
                                documentRow(doc)
                            }
                        }
                        .padding(AppTheme.Spacing.medium)
                    }
                }
            }
            .navigationTitle("Documents")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showFilePicker = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .disabled(store.isUploading)
                }
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.pdf, .jpeg, .png],
                allowsMultipleSelection: false
            ) { result in
                handleFileImport(result)
            }
            .alert("Delete Document?", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) { docToDelete = nil }
                Button("Delete", role: .destructive) {
                    guard let doc = docToDelete else { return }
                    Task {
                        _ = await store.deleteDocument(clientId: clientId, policyId: policy.id, docId: doc.id)
                    }
                    docToDelete = nil
                }
            } message: {
                Text("This will permanently remove the document.")
            }
        }
        .task {
            await store.loadDocuments(clientId: clientId, policyId: policy.id)
        }
    }

    // MARK: - Document Row

    private func documentRow(_ doc: PolicyDocument) -> some View {
        HStack(spacing: AppTheme.Spacing.small) {
            // File icon
            ZStack {
                Circle()
                    .fill(AppTheme.primary.opacity(0.12))
                    .frame(width: 36, height: 36)

                Image(systemName: doc.isPDF ? "doc.text.fill" : "photo.fill")
                    .font(.system(size: 15))
                    .foregroundColor(AppTheme.primary)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(doc.fileName)
                    .font(AppTheme.Typography.accent(iPad ? 15 : 13))
                    .foregroundColor(.primary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(doc.formattedFileSize)
                        .font(AppTheme.Typography.label(iPad ? 12 : 10))
                        .foregroundColor(.secondary)

                    Text(formatDate(doc.uploadedAt))
                        .font(AppTheme.Typography.label(iPad ? 12 : 10))
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Download button
            Button {
                Task { await openDocument(doc) }
            } label: {
                Image(systemName: "arrow.down.circle")
                    .font(.system(size: 20))
                    .foregroundColor(AppTheme.primary)
            }
        }
        .glassCard(cornerRadius: AppTheme.CornerRadius.large, padding: AppTheme.Spacing.compact)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                docToDelete = doc
                showDeleteConfirm = true
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    // MARK: - Helpers

    private func handleFileImport(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result, let url = urls.first else { return }

        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }

        guard let data = try? Data(contentsOf: url) else { return }

        let fileName = url.lastPathComponent
        let ext = url.pathExtension.lowercased()
        let mimeType: String
        switch ext {
        case "pdf": mimeType = "application/pdf"
        case "jpg", "jpeg": mimeType = "image/jpeg"
        case "png": mimeType = "image/png"
        default: mimeType = "application/octet-stream"
        }

        Task {
            _ = await store.uploadDocument(
                clientId: clientId,
                policyId: policy.id,
                fileData: data,
                fileName: fileName,
                mimeType: mimeType
            )
        }
    }

    private func openDocument(_ doc: PolicyDocument) async {
        guard let response = await store.getDocumentUrl(clientId: clientId, policyId: policy.id, docId: doc.id),
              let url = URL(string: response.url) else { return }
        await MainActor.run {
            UIApplication.shared.open(url)
        }
    }

    private func formatDate(_ dateStr: String) -> String {
        let formatters: [DateFormatter] = {
            let iso = DateFormatter()
            iso.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            let simple = DateFormatter()
            simple.dateFormat = "yyyy-MM-dd"
            return [iso, simple]
        }()
        let display = DateFormatter()
        display.dateFormat = "dd MMM yyyy"

        for fmt in formatters {
            if let date = fmt.date(from: dateStr) {
                return display.string(from: date)
            }
        }
        return dateStr
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: "doc.badge.plus")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No documents")
                .font(AppTheme.Typography.headline(iPad ? 20 : 17))
                .foregroundColor(.primary)

            Text("Tap + to upload policy documents, claim forms, or ID proofs")
                .font(AppTheme.Typography.body(iPad ? 16 : 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, AppTheme.Spacing.xxxLarge)
    }
}
