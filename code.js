figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = msg => {
  if (msg.type === 'run-evaluation') {
    const frames = figma.currentPage.children.filter(node => node.type === 'FRAME');
    const report = [];

    for (const frame of frames) {
      const issues = [];
      let score = 100;

      // Heuristic 1: Overloaded screens
      if (frame.children.length > 50) {
        issues.push(`Too many elements (${frame.children.length})`);
        score -= 15;
      }

      // Heuristic 2: Consistency of styles
      const styleSet = new Set();
      frame.children.forEach(child => {
        if (child.type === 'TEXT' && child.style) {
          styleSet.add(JSON.stringify(child.style));
        }
      });
      if (styleSet.size > 5) {
        issues.push(`Too many distinct text styles (${styleSet.size})`);
        score -= 10;
      }

      // Heuristic 3: Minimalist design
      let textCount = 0;
      frame.children.forEach(child => {
        if (child.type === 'TEXT') textCount++;
      });
      if (textCount > 20) {
        issues.push(`Too much text (${textCount} text nodes)`);
        score -= 10;
      }

      // Heuristic 4: Recognition rather than recall
      frame.children.forEach(child => {
        if (child.type === 'RECTANGLE' && child.name.toLowerCase().includes('button')) {
          const hasLabel = frame.children.some(n =>
            n.type === 'TEXT' &&
            Math.abs(n.x - child.x) < child.width &&
            Math.abs(n.y - child.y) < child.height
          );
          if (!hasLabel) {
            issues.push(`Button "${child.name}" may be missing a label`);
            score -= 5;
          }
        }
      });

      if (issues.length > 0) {
        report.push({ frame: frame.name, issues, score });
      } else {
        report.push({ frame: frame.name, issues: ['No issues found'], score });
      }
    }

    figma.ui.postMessage({ type: 'report', data: report });
  }
};
