import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamCard from "@/components/TeamCard";

/**
 * TeamCard Component Tests
 * 
 * We test that the component renders data correctly.
 * We don't test implementation details like CSS classes.
 * 
 * Why test this component?
 * - It's reused throughout the app
 * - Incorrect rendering would break user experience
 * - It transforms data (skills string → array display)
 */

describe("TeamCard", () => {
  const defaultProps = {
    id: "team-1",
    name: "Math Masters",
    description: "A team for math enthusiasts",
    olympiad: "IMO",
    requiredSkills: "Mathematics,Geometry,Number Theory",
    memberCount: 2,
    maxMembers: 4,
    creatorName: "Alice",
    isOpen: true,
  };

  // Why: Users need to see team name and creator to make decisions
  it("renders team name and creator", () => {
    render(<TeamCard {...defaultProps} />);

    expect(screen.getByText("Math Masters")).toBeInTheDocument();
    expect(screen.getByText("by Alice")).toBeInTheDocument();
  });

  // Why: Olympiad badge helps users filter visually
  it("displays olympiad badge", () => {
    render(<TeamCard {...defaultProps} />);

    expect(screen.getByText("IMO")).toBeInTheDocument();
  });

  // Why: Member count helps users know if team has space
  it("shows member count and max members", () => {
    render(<TeamCard {...defaultProps} />);

    expect(screen.getByText("2/4 members")).toBeInTheDocument();
  });

  // Why: Open/closed status affects whether user can join
  it("shows Open status for open teams", () => {
    render(<TeamCard {...defaultProps} />);

    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("shows Full status for closed teams", () => {
    render(<TeamCard {...defaultProps} isOpen={false} />);

    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  // Why: Skills display helps users find relevant teams
  it("displays required skills (limited to 3)", () => {
    render(<TeamCard {...defaultProps} />);

    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Geometry")).toBeInTheDocument();
    expect(screen.getByText("Number Theory")).toBeInTheDocument();
  });

  // Why: When there are many skills, show overflow indicator
  it("shows overflow indicator for more than 3 skills", () => {
    render(
      <TeamCard 
        {...defaultProps} 
        requiredSkills="Math,Physics,Chemistry,Biology" 
      />
    );

    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  // Why: Shows available spots to attract potential members
  it("shows remaining spots for open teams with space", () => {
    render(<TeamCard {...defaultProps} memberCount={2} maxMembers={4} />);

    expect(screen.getByText("2 spots left")).toBeInTheDocument();
  });

  // Why: Handles edge case of description being null
  it("renders without description", () => {
    render(<TeamCard {...defaultProps} description={null} />);

    // Should render without errors
    expect(screen.getByText("Math Masters")).toBeInTheDocument();
  });

  // Why: Handles edge case of empty skills
  it("renders without skills", () => {
    render(<TeamCard {...defaultProps} requiredSkills="" />);

    // Should render without errors
    expect(screen.getByText("Math Masters")).toBeInTheDocument();
    expect(screen.queryByText("Looking for:")).not.toBeInTheDocument();
  });

  // Why: Card should be clickable to navigate to detail page
  it("links to team detail page", () => {
    render(<TeamCard {...defaultProps} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/teams/team-1");
  });
});
