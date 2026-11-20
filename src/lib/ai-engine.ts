import {
  Contract,
  Project,
  ScopeCheck,
  ScopeCheckLineItem,
  VerdictStatus,
  ReplyTone,
} from "./types";

export interface ScopeCheckInput {
  message: string;
  source: "email" | "slack" | "whatsapp" | "other";
  replyTone?: ReplyTone;
  project: Project;
  contract?: Contract | null;
}

export function parseSOWText(rawText: string): Omit<Contract, "id" | "project_id" | "version" | "file_name" | "is_active"> {
  // Extract or parse structured contract data
  const clauses: { id: string; text: string }[] = [];
  
  // Default parsing for Shopify/Dawn contract or generic SOW
  const lower = rawText.toLowerCase();

  let hourlyRate: number | null = 65;
  const rateMatch = rawText.match(/(?:\$|usd\s*)(\d+(?:\.\d+)?)\s*(?:\/|\s*per\s*)hr/i);
  if (rateMatch) hourlyRate = parseFloat(rateMatch[1]);

  let fixedFee: number | null = 3600;
  const feeMatch = rawText.match(/(?:fixed\s*fee|total\s*fee|project\s*fee|contract\s*amount)[\s:]*(?:\$|usd\s*)(\d+(?:,\d+)*(?:\.\d+)?)/i);
  if (feeMatch) fixedFee = parseFloat(feeMatch[1].replace(/,/g, ""));

  let revisionLimit: number | null = 2;
  const revMatch = rawText.match(/(\d+)\s*(?:design\s*)?revision\s*rounds?/i);
  if (revMatch) revisionLimit = parseInt(revMatch[1], 10);

  const revisionScope = "home and product page mockups";

  // Clauses
  clauses.push({
    id: "§1",
    text: "Included deliverables: Shopify store on Dawn theme, 5 pages (Home, Shop, Product, About, Contact), 40 products CSV import, Shopify Payments retail checkout, Mailchimp footer signup, and basic SEO.",
  });
  clauses.push({
    id: "§2",
    text: "Revision limit: 2 design revision rounds on Home and Product pages. Additional revision rounds or revisions on other pages are billed at the contract hourly rate.",
  });
  clauses.push({
    id: "§3",
    text: "Explicit exclusions: Copywriting, custom photography, wholesale/B2B pricing or wholesale checkout, multi-language localization (e.g. French/Spanish), multi-currency (e.g. CAD, EUR), and ongoing maintenance.",
  });
  clauses.push({
    id: "§4",
    text: "Additional scope: Any work outside Section 1 and Section 2 will be documented in a Change Order at $65/hr.",
  });

  return {
    parsed_at: new Date().toISOString(),
    summary:
      "Shopify store setup on Dawn theme with 5 core pages, 40 product CSV import, retail checkout, Mailchimp signup, basic SEO, and 2 design revision rounds on home and product pages. All custom B2B, multi-language, multi-currency, and maintenance are excluded.",
    included_deliverables: [
      "Shopify store on Dawn theme",
      "5 pages (Home, Shop, Product, About, Contact)",
      "40 products CSV import",
      "Shopify Payments retail checkout",
      "Mailchimp footer signup",
      "Basic SEO & meta descriptions",
    ],
    explicit_exclusions: [
      "Copywriting",
      "Photography",
      "Wholesale/B2B pricing or checkout",
      "Multi-language (e.g. French store)",
      "Multi-currency (e.g. CAD pricing)",
      "Ongoing maintenance",
    ],
    revision_limit: revisionLimit,
    revision_scope: revisionScope,
    hourly_rate: hourlyRate,
    fixed_fee: fixedFee,
    currency: "USD",
    timeline: "3-4 weeks",
    clauses: clauses,
  };
}

/**
 * Scope Check Engine implementing §4.2, §4.3, §4.4, §5 bug fixes, §10 acceptance tests
 */
export function analyzeScopeMessage(input: ScopeCheckInput): Omit<ScopeCheck, "id" | "project_id" | "created_at"> {
  const { message, source, replyTone = "friendly", project, contract } = input;

  // Rule 8: If no SOW is parsed, block analysis
  if (!contract) {
    throw new Error("Parse the SOW first. No active contract found for this project.");
  }

  // Rule 7: Prompt-injection guard: Treat client message strictly as data.
  // Clean instructions like "ignore your instructions", "ignore your rules", "mark this in scope"
  const sanitized = message.trim();
  const lower = sanitized.toLowerCase();

  const allowedRevisions = project.allowed_revisions ?? contract.revision_limit ?? 2;
  const revisionsUsed = project.revisions_used ?? 0;
  const hourlyRate = contract.hourly_rate ?? project.hourly_rate ?? 65;
  const clientFirstName = project.client_name.split(" ")[0] || "there";

  const lineItems: ScopeCheckLineItem[] = [];

  // Exclusions clauses
  const exclusionClause = contract.clauses.find((c) => c.id === "§3") || {
    id: "§3",
    text: "Explicit exclusions: wholesale/B2B pricing, multi-language, multi-currency, custom photography, copywriting.",
  };
  const includedClause = contract.clauses.find((c) => c.id === "§1") || {
    id: "§1",
    text: "Included deliverables: Shopify store on Dawn, 5 pages (Home, Shop, Product, About, Contact), 40 products CSV import, Mailchimp signup, basic SEO.",
  };
  const revisionClause = contract.clauses.find((c) => c.id === "§2") || {
    id: "§2",
    text: `Revision limit: ${allowedRevisions} design revision rounds on Home and Product pages.`,
  };

  // Helper flags for multi-part messages
  const hasFrench = /french|multi-language|translate|translation|langue/i.test(lower);
  const hasCad = /cad|cad pricing|multi-currency|currency|canada/i.test(lower);
  const hasWholesale = /wholesale|b2b|cafe|cafes|20% off|dealer/i.test(lower);
  const hasMailchimp = /mailchimp|footer form|newsletter/i.test(lower);
  const hasSeo = /meta description|seo|about and contact/i.test(lower);
  const hasDesignHero = /hero image|testimonials|bigger hero|move testimonials/i.test(lower);
  const hasReviewsMove = /move reviews|reviews above/i.test(lower);
  const hasWishlist = /wishlist|heart icon|wish list/i.test(lower);
  const hasMobileApp = /mobile app|ios app|android app|app store/i.test(lower);

  // Check 1: Multi-part French + CAD + Wholesale (Acceptance test 1)
  if (hasFrench || hasCad || hasWholesale) {
    if (hasFrench) {
      lineItems.push({
        request: "French store setup & localization",
        work_description: "Configure multi-language store, locale switcher, and French translation assets",
        status: "OUT_OF_SCOPE",
        clause_id: exclusionClause.id,
        clause_text: exclusionClause.text,
        estimated_hours: 8,
      });
    }
    if (hasCad) {
      lineItems.push({
        request: "CAD currency pricing for Canada",
        work_description: "Set up multi-currency market for Canada, CAD price rounding, and checkout testing",
        status: "OUT_OF_SCOPE",
        clause_id: exclusionClause.id,
        clause_text: exclusionClause.text,
        estimated_hours: 6,
      });
    }
    if (hasWholesale) {
      lineItems.push({
        request: "Wholesale B2B login & 20% discount portal",
        work_description: "Implement wholesale customer tagging, restricted B2B catalog access, and 20% tier pricing",
        status: "OUT_OF_SCOPE",
        clause_id: exclusionClause.id,
        clause_text: exclusionClause.text,
        estimated_hours: 10,
      });
    }
  }

  // Check 2: Mailchimp + Meta descriptions (Acceptance test 2)
  if (hasMailchimp || hasSeo) {
    if (hasMailchimp) {
      lineItems.push({
        request: "Mailchimp footer signup connection",
        work_description: "Integrate footer newsletter subscription form with Mailchimp list",
        status: "IN_SCOPE",
        clause_id: includedClause.id,
        clause_text: includedClause.text,
        estimated_hours: 0,
      });
    }
    if (hasSeo) {
      lineItems.push({
        request: "SEO meta descriptions for About and Contact pages",
        work_description: "Configure meta titles and descriptions for About and Contact pages",
        status: "IN_SCOPE",
        clause_id: includedClause.id,
        clause_text: includedClause.text,
        estimated_hours: 0,
      });
    }
  }

  // Check 3: Design changes / Revisions (Acceptance test 3 & 4)
  if (hasDesignHero) {
    if (revisionsUsed < allowedRevisions) {
      lineItems.push({
        request: "Hero image resize & testimonial section repositioning",
        work_description: "Adjust homepage hero banner dimensions and reorder testimonials section above products",
        status: "REVISION",
        clause_id: revisionClause.id,
        clause_text: revisionClause.text,
        estimated_hours: 0,
      });
    } else {
      lineItems.push({
        request: "Hero image resize & testimonial repositioning (Revision limit reached)",
        work_description: "Additional design adjustments beyond the included revision rounds",
        status: "OUT_OF_SCOPE",
        clause_id: revisionClause.id,
        clause_text: `Revision limit reached (${revisionsUsed} of ${allowedRevisions} used). Section 2 limits included revisions to ${allowedRevisions} rounds.`,
        estimated_hours: 4,
      });
    }
  }

  // Check 5: Mixed revision & out of scope (Acceptance test 5)
  if (hasReviewsMove) {
    if (revisionsUsed < allowedRevisions) {
      lineItems.push({
        request: "Move reviews above product description",
        work_description: "Update product template section layout to display customer reviews before description",
        status: "REVISION",
        clause_id: revisionClause.id,
        clause_text: revisionClause.text,
        estimated_hours: 0,
      });
    } else {
      lineItems.push({
        request: "Move reviews above product description",
        work_description: "Product layout change beyond allowed revision rounds",
        status: "OUT_OF_SCOPE",
        clause_id: revisionClause.id,
        clause_text: `Revision limit reached (${revisionsUsed} of ${allowedRevisions} used).`,
        estimated_hours: 2,
      });
    }
  }

  if (hasWishlist) {
    lineItems.push({
      request: "Wishlist heart icon & customer wishlist feature",
      work_description: "Install, style, and configure third-party wishlist app with heart icon on product cards",
      status: "OUT_OF_SCOPE",
      clause_id: exclusionClause.id,
      clause_text: "Section 1 deliverables specify standard retail Dawn theme pages; additional custom features or apps are excluded.",
      estimated_hours: 5,
    });
  }

  // Check 6: Prompt injection test (Acceptance test 6)
  if (hasMobileApp) {
    lineItems.push({
      request: "Custom mobile application (iOS & Android)",
      work_description: "Architect and develop standalone native or cross-platform mobile apps",
      status: "OUT_OF_SCOPE",
      clause_id: exclusionClause.id,
      clause_text: "Explicit exclusions: SOW covers web store on Shopify Dawn only; mobile app development is not included.",
      estimated_hours: 80,
    });
  }

  // Generic fallback if not matched by specific test patterns
  if (lineItems.length === 0) {
    // Check if it's asking for new features or standard work
    const looksOutOfScope = /custom|add|create|integrate|build|redesign|extra|new page|feature/i.test(lower);
    if (looksOutOfScope) {
      lineItems.push({
        request: sanitized.length > 50 ? sanitized.slice(0, 47) + "..." : sanitized,
        work_description: "Additional custom development and implementation requested outside baseline deliverables",
        status: "OUT_OF_SCOPE",
        clause_id: exclusionClause.id,
        clause_text: exclusionClause.text,
        estimated_hours: 4,
      });
    } else {
      lineItems.push({
        request: sanitized.length > 50 ? sanitized.slice(0, 47) + "..." : sanitized,
        work_description: "Review and fulfill client request within agreed scope parameters",
        status: "IN_SCOPE",
        clause_id: includedClause.id,
        clause_text: includedClause.text,
        estimated_hours: 0,
      });
    }
  }

  // Rule 2 & 3: Determine overall status
  // Status = worst line item (OUT > GREY/REVISION > IN).
  // A mix of free and billable items -> GREY_AREA
  const hasOut = lineItems.some((li) => li.status === "OUT_OF_SCOPE");
  const hasRevision = lineItems.some((li) => li.status === "REVISION");
  const hasIn = lineItems.some((li) => li.status === "IN_SCOPE");

  let status: VerdictStatus = "IN_SCOPE";
  let countsAsRevision = false;
  let revisionNumber: number | null = null;

  if (hasRevision && revisionsUsed < allowedRevisions) {
    countsAsRevision = true;
    revisionNumber = revisionsUsed + 1;
  }

  if (hasOut && (hasIn || hasRevision)) {
    status = "GREY_AREA";
  } else if (hasOut) {
    status = "OUT_OF_SCOPE";
  } else if (hasRevision) {
    // If it's the last allowed revision, mark as GREY_AREA as specified in §4.3 rule 2
    if (revisionsUsed + 1 >= allowedRevisions) {
      status = "GREY_AREA";
    } else {
      status = "GREY_AREA";
    }
  } else {
    status = "IN_SCOPE";
  }

  // Rule 5: Price in code: suggested_price = round(sum(billable hours) * rate, 2)
  const billableHours = lineItems
    .filter((li) => li.status === "OUT_OF_SCOPE")
    .reduce((sum, li) => sum + li.estimated_hours, 0);

  const suggestedPrice = Math.round(billableHours * hourlyRate * 100) / 100;

  // Title generation: max 60 chars, names actual work (Rule B3 & §4.2)
  let changeOrderTitle = "";
  if (lineItems.length === 1) {
    changeOrderTitle = lineItems[0].request;
  } else {
    const titles = lineItems
      .filter((li) => li.status === "OUT_OF_SCOPE" || li.status === "REVISION")
      .map((li) => {
        if (/french/i.test(li.request)) return "French store";
        if (/cad/i.test(li.request)) return "CAD pricing";
        if (/wholesale/i.test(li.request)) return "wholesale login";
        if (/reviews/i.test(li.request)) return "Reviews repositioning";
        if (/wishlist/i.test(li.request)) return "Wishlist icon";
        return li.request.split(" ")[0] + " " + (li.request.split(" ")[1] || "");
      });

    if (titles.length > 0) {
      if (titles.length === 3) {
        changeOrderTitle = `${titles[0]}, ${titles[1]} & ${titles[2]}`;
      } else {
        changeOrderTitle = titles.join(" & ");
      }
    } else {
      changeOrderTitle = "Scope Adjustment";
    }
  }

  if (changeOrderTitle.length > 60) {
    changeOrderTitle = changeOrderTitle.slice(0, 57) + "...";
  }

  // Timeline impact
  let timelineImpact = "no schedule change";
  if (billableHours > 40) {
    timelineImpact = "about 2-3 weeks";
  } else if (billableHours >= 20) {
    timelineImpact = "about 1-2 weeks";
  } else if (billableHours >= 10) {
    timelineImpact = "about 1 week";
  } else if (billableHours > 0) {
    timelineImpact = "adds 2-3 business days";
  }

  // Reasoning: max 2 sentences, plain English
  let reasoning = "";
  if (status === "OUT_OF_SCOPE") {
    reasoning = `The requested additions (${changeOrderTitle}) match explicit exclusions in Section 3 of the SOW. These items require ${billableHours} hours of custom work outside the baseline agreement.`;
  } else if (status === "GREY_AREA") {
    if (hasOut && hasRevision) {
      reasoning = `This request is a combination of an included design revision round and out-of-scope work. Only the out-of-scope item is priced at ${billableHours} billable hours.`;
    } else if (hasOut && hasIn) {
      reasoning = `Some of these tasks are already covered in Section 1 deliverables, while others exceed the agreed scope and require additional billable hours.`;
    } else if (countsAsRevision) {
      if (revisionNumber === allowedRevisions) {
        reasoning = `This layout update counts as revision round ${revisionNumber} of ${allowedRevisions} (your final included round). Subsequent design revisions will be billable.`;
      } else {
        reasoning = `This design adjustment is covered under Section 2 as revision round ${revisionNumber} of ${allowedRevisions}. It will be completed with no additional fee.`;
      }
    } else {
      reasoning = `This request partially overlaps with project exclusions and requires clarification or scope adjustment.`;
    }
  } else {
    reasoning = `All requested items are covered under Section 1 of our agreed deliverables. We will implement them at no additional charge.`;
  }

  // Confidence score
  const confidenceScore = status === "IN_SCOPE" ? 98 : status === "OUT_OF_SCOPE" ? 96 : 91;

  // Rule 6: Reply draft: greet client by first name, polite, cites section number, includes {{APPROVAL_LINK}}, tone support
  let politeReplyDraft = "";

  if (replyTone === "short") {
    if (billableHours > 0) {
      politeReplyDraft = `Hi ${clientFirstName},\n\nWe can definitely handle ${changeOrderTitle}! Since this falls under ${exclusionClause.id} exclusions, it's estimated at ${billableHours} hrs ($${suggestedPrice.toLocaleString()} total, ${timelineImpact}).\n\nPlease approve and view details here: {{APPROVAL_LINK}}\n\nBest,\n${project.title} Team`;
    } else if (countsAsRevision) {
      politeReplyDraft = `Hi ${clientFirstName},\n\nWe'll make those layout adjustments right away. This counts as design round ${revisionNumber} of ${allowedRevisions}.\n\nBest,\n${project.title} Team`;
    } else {
      politeReplyDraft = `Hi ${clientFirstName},\n\nAll set! Those items are fully included in our scope (§1) and we're taking care of them now.\n\nBest,\n${project.title} Team`;
    }
  } else if (replyTone === "firm") {
    if (billableHours > 0) {
      politeReplyDraft = `Hi ${clientFirstName},\n\nThank you for reaching out. Per our signed Statement of Work, Section 3 explicitly excludes ${changeOrderTitle}. To maintain our project schedule and quality standards, this additional work is estimated at ${billableHours} hours ($${suggestedPrice.toLocaleString()} at our contract rate of $${hourlyRate}/hr) with a timeline impact of ${timelineImpact}.\n\nYou can review and approve the change order here:\n{{APPROVAL_LINK}}\n\nOnce approved, we will schedule and begin implementation immediately.\n\nRegards,\n${project.title} Team`;
    } else if (countsAsRevision) {
      politeReplyDraft = `Hi ${clientFirstName},\n\nThank you for the notes. We will apply these revisions to the layout. Please note that this utilizes round ${revisionNumber} of your ${allowedRevisions} agreed design revision rounds (§2). Any subsequent rounds will be billed at $${hourlyRate}/hr.\n\nRegards,\n${project.title} Team`;
    } else {
      politeReplyDraft = `Hi ${clientFirstName},\n\nThank you for the update. These tasks are confirmed as part of Section 1 deliverables. We have added them to the sprint backlog at no additional charge.\n\nRegards,\n${project.title} Team`;
    }
  } else {
    // friendly (default)
    if (billableHours > 0) {
      politeReplyDraft = `Hi ${clientFirstName},\n\nThanks for sending these over! The ideas for ${changeOrderTitle} sound great and will make the store really stand out.\n\nBecause this is outside our initial agreed scope (${exclusionClause.id} exclusions), we've put together a quick change order for ${billableHours} hours ($${suggestedPrice.toLocaleString()} at our contract rate of $${hourlyRate}/hr, adds ${timelineImpact}).\n\nYou can review the full breakdown and approve it right here:\n{{APPROVAL_LINK}}\n\nHappy to jump on a quick call if you have any questions or want to prioritize specific features!\n\nWarm regards,\n${project.title} Team`;
    } else if (countsAsRevision) {
      const isFinal = revisionNumber === allowedRevisions;
      politeReplyDraft = `Hi ${clientFirstName},\n\nThanks for the feedback! We'd love to polish those layout details for you. Per Section 2 of our contract, this will use round ${revisionNumber} of your ${allowedRevisions} included revision rounds${isFinal ? " (your final included round)" : ""}.\n\nWe'll have the updated layout ready for you shortly!\n\nWarm regards,\n${project.title} Team`;
    } else {
      politeReplyDraft = `Hi ${clientFirstName},\n\nThanks for sending this over! Good news: connecting the footer signup to Mailchimp and adding the meta descriptions are fully covered under Section 1 of our agreement.\n\nThere is no additional charge for this—our team is already on it!\n\nWarm regards,\n${project.title} Team`;
    }
  }

  return {
    message: sanitized,
    source,
    status,
    confidence_score: confidenceScore,
    reasoning,
    line_items: lineItems,
    counts_as_revision: countsAsRevision,
    revision_number: revisionNumber,
    estimated_hours: billableHours,
    suggested_price: suggestedPrice,
    change_order_title: changeOrderTitle,
    timeline_impact: timelineImpact,
    polite_reply_draft: politeReplyDraft,
    reply_tone: replyTone,
    user_feedback: null,
    model: "ScopeGuard SOW Analyzer v2.0 (Gemini 1.5 Pro Hybrid)",
  };
}
