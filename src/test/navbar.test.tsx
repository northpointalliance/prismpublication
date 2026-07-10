import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";

const mockUsePortalAuth = vi.fn();

vi.mock("../components/portal/PortalAuthProvider", () => ({
  usePortalAuth: () => mockUsePortalAuth(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockUsePortalAuth.mockReturnValue({
      user: null,
      currentRole: null,
    });
  });

  it("renders a visible How It Works navigation link", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /how it works/i })).toBeInTheDocument();
  });
});
