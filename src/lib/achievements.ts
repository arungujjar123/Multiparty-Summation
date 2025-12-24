/**
 * @fileoverview Achievement tracking utilities
 */

export class AchievementTracker {
  private static isBrowser = typeof window !== "undefined";

  /**
   * Track page visit
   */
  static trackPageVisit(page: "docs" | "glossary" | "faq" | "code" | "visualizer") {
    if (!this.isBrowser) return;
    
    localStorage.setItem(`visited_${page}`, "true");
    
    // Track first visit
    if (!localStorage.getItem("first_visit_date")) {
      localStorage.setItem("first_visit_date", new Date().toISOString());
    }
  }

  /**
   * Track quiz completion
   */
  static trackQuizAttempt(score: number, totalQuestions: number) {
    if (!this.isBrowser) return;

    const attempts = parseInt(localStorage.getItem("quiz_attempts") || "0");
    localStorage.setItem("quiz_attempts", (attempts + 1).toString());

    // Track perfect scores
    if (score === totalQuestions) {
      const perfectScores = parseInt(
        localStorage.getItem("quiz_perfect_scores") || "0"
      );
      localStorage.setItem("quiz_perfect_scores", (perfectScores + 1).toString());
    }
  }

  /**
   * Track visualizer usage
   */
  static trackVisualizerRun(operation: "summation" | "multiplication") {
    if (!this.isBrowser) return;

    const runs = parseInt(localStorage.getItem("visualizer_runs") || "0");
    localStorage.setItem("visualizer_runs", (runs + 1).toString());

    // Track completion by operation type
    const key = `completed_${operation}`;
    const completions = parseInt(localStorage.getItem(key) || "0");
    localStorage.setItem(key, (completions + 1).toString());
  }

  /**
   * Get current progress
   */
  static getProgress() {
    if (!this.isBrowser) return {};

    return {
      quiz_attempts: parseInt(localStorage.getItem("quiz_attempts") || "0"),
      quiz_perfect_scores: parseInt(
        localStorage.getItem("quiz_perfect_scores") || "0"
      ),
      visited_docs: localStorage.getItem("visited_docs") === "true",
      visited_glossary: localStorage.getItem("visited_glossary") === "true",
      visited_faq: localStorage.getItem("visited_faq") === "true",
      visited_code: localStorage.getItem("visited_code") === "true",
      visualizer_runs: parseInt(localStorage.getItem("visualizer_runs") || "0"),
      completed_summation: parseInt(
        localStorage.getItem("completed_summation") || "0"
      ),
      completed_multiplication: parseInt(
        localStorage.getItem("completed_multiplication") || "0"
      ),
      first_visit_date: localStorage.getItem("first_visit_date"),
    };
  }

  /**
   * Check if new achievements were unlocked
   */
  static checkNewAchievements(): string[] {
    if (!this.isBrowser) return [];

    // This could be enhanced to return newly unlocked achievement IDs
    // For now, it's a placeholder for future notification system
    return [];
  }
}
