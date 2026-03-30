import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeedWizard from "@/components/SeedWizard";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("SeedWizard", () => {
  it("advances to the preview step and submits the selected hierarchy", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    renderWithProviders(
      <SeedWizard isSubmitting={false} errorMessage={null} onSubmit={onSubmit} />,
      {
        preloadedUiState: {
          seedWizard: {
            isOpen: true,
            step: 1,
            projectType: "Campaign Launch",
            teamType: "Brand Studio",
            campaignCount: 3,
            includeArchive: true,
          },
        },
      }
    );

    await user.selectOptions(screen.getByLabelText("Project type"), "Brand Refresh");
    await user.selectOptions(screen.getByLabelText("Team type"), "Creative Ops");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText(/Brand Refresh/i)).toBeInTheDocument();
    expect(screen.getByText(/Creative Ops/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Campaign count"));
    await user.type(screen.getByLabelText("Campaign count"), "5");
    await user.click(screen.getByRole("button", { name: "Generate hierarchy" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
