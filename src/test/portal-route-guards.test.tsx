import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  RequirePortalLogin,
  RequireWorkspaceRole,
  RequireWorkspaceSelection,
} from "@/components/portal/PortalRouteGuards";
import { usePortalAuth } from "@/components/portal/PortalAuthProvider";

vi.mock("@/components/portal/PortalAuthProvider", () => ({
  usePortalAuth: vi.fn(),
}));

const mockedUsePortalAuth = vi.mocked(usePortalAuth);

const defaultAuth = {
  user: null,
  workspaces: [],
  currentWorkspaceId: null,
  currentRole: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  logout: vi.fn(),
  selectWorkspace: vi.fn(),
  createWorkspace: vi.fn(),
  refreshEntryContext: vi.fn(),
};

describe("Portal route guards", () => {
  it("redirects to /app/login when not authenticated", () => {
    mockedUsePortalAuth.mockReturnValue({ ...defaultAuth });

    render(
      <MemoryRouter initialEntries={["/app/advertiser"]}>
        <Routes>
          <Route element={<RequirePortalLogin />}>
            <Route path="/app/advertiser" element={<div>Advertiser</div>} />
          </Route>
          <Route path="/app/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects to /app/choose-workspace when workspace is missing", () => {
    mockedUsePortalAuth.mockReturnValue({
      ...defaultAuth,
      user: { id: "u1", email: "user@example.com", name: "User" },
      currentWorkspaceId: null,
    });

    render(
      <MemoryRouter initialEntries={["/app/advertiser"]}>
        <Routes>
          <Route element={<RequireWorkspaceSelection />}>
            <Route path="/app/advertiser" element={<div>Advertiser</div>} />
          </Route>
          <Route path="/app/choose-workspace" element={<div>Choose Workspace</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Choose Workspace")).toBeInTheDocument();
  });

  it("redirects to /app/choose-workspace for role mismatch", () => {
    mockedUsePortalAuth.mockReturnValue({
      ...defaultAuth,
      user: { id: "u1", email: "user@example.com", name: "User" },
      currentWorkspaceId: "org1",
      currentRole: "publisher",
    });

    render(
      <MemoryRouter initialEntries={["/app/advertiser"]}>
        <Routes>
          <Route element={<RequireWorkspaceRole role="advertiser" />}>
            <Route path="/app/advertiser" element={<div>Advertiser</div>} />
          </Route>
          <Route path="/app/choose-workspace" element={<div>Choose Workspace</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Choose Workspace")).toBeInTheDocument();
  });

  it("allows access when role matches", () => {
    mockedUsePortalAuth.mockReturnValue({
      ...defaultAuth,
      user: { id: "u1", email: "user@example.com", name: "User" },
      currentWorkspaceId: "org1",
      currentRole: "advertiser",
    });

    render(
      <MemoryRouter initialEntries={["/app/advertiser"]}>
        <Routes>
          <Route element={<RequireWorkspaceRole role="advertiser" />}>
            <Route path="/app/advertiser" element={<div>Advertiser Allowed</div>} />
          </Route>
          <Route path="/app/choose-workspace" element={<div>Choose Workspace</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Advertiser Allowed")).toBeInTheDocument();
  });
});
