import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BoardTree from "@/components/BoardTree";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { BoardNode } from "@/types/board";

jest.mock("@dnd-kit/react", () => ({
  useDraggable: () => ({
    draggable: {},
    isDragging: false,
    isDropping: false,
    isDragSource: false,
    handleRef: jest.fn(),
    ref: jest.fn(),
  }),
  useDroppable: () => ({
    droppable: {},
    isDropTarget: false,
    ref: jest.fn(),
  }),
}));

const boardTree: BoardNode[] = [
  {
    id: "root-1",
    name: "Launch Workspace",
    parentId: null,
    depth: 1,
    createdAt: "2026-03-12T10:00:00.000Z",
    updatedAt: "2026-03-12T10:00:00.000Z",
    children: [
      {
        id: "child-1",
        name: "Campaigns",
        parentId: "root-1",
        depth: 2,
        createdAt: "2026-03-12T10:00:00.000Z",
        updatedAt: "2026-03-12T10:00:00.000Z",
        children: [],
      },
    ],
  },
];

describe("BoardTree", () => {
  it("renders recursive nodes and forwards row actions", async () => {
    const user = userEvent.setup();
    const onToggleExpand = jest.fn();
    const onCreate = jest.fn();
    const onMove = jest.fn();
    const onDelete = jest.fn();

    renderWithProviders(
      <BoardTree
        boards={boardTree}
        selectedBoardId={null}
        expandedBoardIds={new Set(["root-1"])}
        draggedBoardId={null}
        invalidDropIds={new Set()}
        draggedBoardParentId={null}
        onSelect={jest.fn()}
        onToggleExpand={onToggleExpand}
        onCreate={onCreate}
        onMove={onMove}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Launch Workspace")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();

    const rootRow = screen.getByText("Launch Workspace").closest('[role="button"]');
    expect(rootRow).not.toBeNull();
    const rootScope = within(rootRow as HTMLElement);

    await user.click(rootScope.getByRole("button", { name: "Collapse Launch Workspace" }));
    expect(onToggleExpand).toHaveBeenCalledWith("root-1");

    await user.click(rootScope.getByRole("button", { name: "Add child" }));
    expect(onCreate).toHaveBeenCalledWith("root-1");

    await user.click(rootScope.getByRole("button", { name: "Move" }));
    expect(onMove).toHaveBeenCalledWith("root-1");

    await user.click(rootScope.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("root-1");
  });
});
