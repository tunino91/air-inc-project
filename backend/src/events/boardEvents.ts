export interface BoardEventPublisher {
  emit(event: string, payload: unknown): void;
}

export class NoopBoardEventPublisher implements BoardEventPublisher {
  emit() {
    // Tests can use the service layer without needing a real Socket.IO server.
    return undefined;
  }
}
