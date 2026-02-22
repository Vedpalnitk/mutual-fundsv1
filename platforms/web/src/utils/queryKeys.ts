export const clientKeys = {
  all: ['clients'] as const,
  list: (filters: Record<string, any>) => [...clientKeys.all, 'list', filters] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
}

export const holdingKeys = {
  all: ['holdings'] as const,
  byClient: (clientId: string) => [...holdingKeys.all, clientId] as const,
}

export const sipKeys = {
  all: ['sips'] as const,
  byClient: (clientId: string) => [...sipKeys.all, clientId] as const,
}

export const goalKeys = {
  all: ['goals'] as const,
  byClient: (clientId: string) => [...goalKeys.all, clientId] as const,
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  calendar: () => [...dashboardKeys.all, 'calendar'] as const,
  insights: () => [...dashboardKeys.all, 'insights'] as const,
}

export const bseKeys = {
  all: ['bse'] as const,
  orders: (filters?: Record<string, any>) => [...bseKeys.all, 'orders', filters] as const,
  mandates: (filters?: Record<string, any>) => [...bseKeys.all, 'mandates', filters] as const,
  schemes: (query?: string) => [...bseKeys.all, 'schemes', query] as const,
}

export const nmfKeys = {
  all: ['nmf'] as const,
  orders: (filters?: Record<string, any>) => [...nmfKeys.all, 'orders', filters] as const,
  mandates: (filters?: Record<string, any>) => [...nmfKeys.all, 'mandates', filters] as const,
  schemes: (query?: string) => [...nmfKeys.all, 'schemes', query] as const,
  systematic: (filters?: Record<string, any>) => [...nmfKeys.all, 'systematic', filters] as const,
}
