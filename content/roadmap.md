# Physical AI, Robotics, and Autonomous Drones: A Verified Learning-and-Research Roadmap for Sudish

**Stated report date:** 2026-10-20 (20 October 2026).

**Evidence verification window:** 20 October 2026, 18:47 UTC through 21 October 2026, 03:26 UTC, across six evidence dossiers, two independent review documents, and targeted revision checks (exact dossier windows in Appendix D). Checks after midnight only inspected immutable or already-published material available by the stated date and recorded a single-machine artifact smoke observation with a partial manifest; they do not establish a post-report event. “Current,” “latest,” prices, versions, course status, regulations, and prize details mean the latest material independently accessible by the **20 October 2026 substantive cutoff**. **No event, release, law, course completion, or award after 20 October 2026 is treated as having occurred. Future dates appear only as schedules published by sources available by the cutoff.** This report never fabricates or assumes later evidence.

**Reader assumptions:** a software/AI builder with working Python and ordinary development habits; no assumed graduate mathematics, control theory, electronics, or mechanics; India-relevant operating context; unknown current skill level; two weekly-time scenarios (10 h and 20 h); preference for free or low-cost resources; no assumed laboratory, GPU, aircraft, or legal flight area.

**What this report is not:** legal advice, flight authorisation, product or safety certification, or a forecast of publications, admissions, funding, or prizes. A static document cannot establish that a particular aircraft, pilot, radio, place, time, or import is lawful; recheck official sources immediately before acting.

---

## Contents

0. How to read this report
1. Executive answer: what to do first
2. Start-this-week checklist
3. The best 10 resources
4. Personalization questions and decision rules
5. Field map, definitions, and competency model
6. Verified frontier and open problems (12 clusters)
7. Seminal-to-frontier reading map
8. Structured curriculum (M0–M11)
9. Tiered books and chapters
10. Substantive media: lectures, seminars, talks, podcasts, feeds
11. Practical stack, versions, and the experimental standard
12. Project ladder, hardware gates, and dated budgets
13. Indian drone rules and responsible operation
14. Three specialization tracks and decision criteria
15. Two 24-month plans: 10 h/week and 20 h/week
16. Research practice and career development
17. Low-noise monitoring system
18. The Nobel question and verified relevant prizes
19. Methodology, cross-checks, conflicts, and limitations
Appendices A–D

---

## 0. How to read this report

### Labels

| Label | Meaning |
|---|---|
| **[FACT]** | Directly checkable from the linked source: a date, version, rule, price, or a result as its own authors report it. |
| **[JUDGMENT]** | This report's recommendation or synthesis. The criterion is stated; it is not presented as consensus. |
| **[UNCERTAIN]** | Partial, conflicting, inaccessible-in-full, or single-family evidence. Confidence is lowered and the gap named. |
| **[HYPE/DEMO]** | Promotional material, vendor self-evaluation, demo-only evidence, or unreplicated scale claims. The missing evidence is named. |
| **[STALE-BUT-FOUNDATIONAL]** | Examples, software, or empirical context have aged; the mechanism is still worth learning. A low currency score here is not low scientific value. |

### Scores

Resources carry **Q/P/D/V/C** scores from 1 to 5: quality, prerequisite level (a higher number means harder entry, not better quality), depth, practical value, and currency for the stated role.

### Evidence rules used throughout

- Primary and official sources are preferred: final proceedings and DOI records, official course and book pages, official software release records, the Gazette of India and Ministry of Civil Aviation documents, and official prize statutes.
- A paper, its project page, its code repository, and its lab blog are **one evidence family**. Two independent families are required before a frontier, legal, price, safety, superlative, or prize claim is stated as settled; otherwise it is marked **[UNCERTAIN]** or **[HYPE/DEMO]**.
- Vendor claims establish what the vendor claims, not that the claim generalizes.
- Sources are summarized in original words. Reported numbers are the authors' numbers unless an independent family confirms them.
- Conflicts between sources are preserved and listed in §19, not averaged away.

### Price conversion

**[FACT]** The `2026-10-20` row in the European Central Bank's durable full-history table gives EUR 1 = USD 1.1215 and EUR 1 = INR 106.4590, so **USD 1 ≈ INR 106.4590 / 1.1215 = 94.9255** ([ECB euro foreign-exchange full historical XML, row 2026-10-20](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml)). INR figures below are arithmetic planning comparisons and exclude card spread, GST, customs duty, shipping, hazardous-battery shipping, warranty, and exchange-rate movement; they are not landed quotes.

---

## 1. Executive answer: what to do first

**[JUDGMENT, high confidence]** The shortest route from “software/AI builder” to credible physical-AI research is a simulation-first Linux path whose resolved versions are captured, with one dependency-ordered curriculum, one bounded public-artifact study, and one narrow falsifiable thesis. Hardware waits until simulation exposes a question only hardware can answer. This route minimizes cost, prerequisite shock, safety/legal exposure, and irreproducible demos.

### The ten decisions

1. **[JUDGMENT] Use one documented-compatibility baseline, then freeze what actually installs:** Ubuntu 24.04 LTS, ROS 2 Jazzy Jalisco, Gazebo Harmonic, MuJoCo 3.16.0, and, for aerial work, PX4 v1.17.0 SITL with QGroundControl v5.1.5 (§11). The combination is supported by upstream documentation but was **not integration-tested for this report**. Record exact apt packages, Python wheels, compiler, RMW, bridge, container digest, and smoke-test outputs before an experiment.
2. **[JUDGMENT] Follow the 160-hour F-course contract, not the full-course catalog:** mathematics → geometry/dynamics/control → estimation/planning → ROS 2, then the selected track's perception/learning/control extracts (§8, §14.2). The 10 h plan charges all 160 F hours, every project hour, reading, writing, community work, and an 80-hour buffer once; the 20 h plan adds 90 hours of depth, not another MOOC collection (§15.4).
3. **[JUDGMENT] Use one bounded CPU artifact study for Tracks B/C, with its evidence boundary visible:** `safe-control-gym` release `v1.0.0`, immutable commit `dd1b293`, contains the documented 2-D quadrotor PPO command, task/configuration, evaluator, and checkpoint (§11.5). A **single-machine smoke observation with a partial manifest** ran the README command arguments successfully on CPU, adding only a headless plotting backend and the disclosed dependency fixes. It is an **artifact health check mapped to the paper's Figures 5–6**, not a claim that one checkpoint run reproduces the full paper. Rung 5 must either run the paper-matched comparator set and metric or report `checkpoint evaluation, not full-paper reproduction`.
4. **[FACT + JUDGMENT] Treat Diffusion Policy Push-T as a separate Track-A GPU profile:** the author artifact uses PyMunk, Python 3.9, PyTorch 1.12.1 and CUDA 11.6, not MuJoCo or the core Python 3.12 profile. Image Push-T training uses `image_pusht_diffusion_policy_cnn.yaml` and `cuda:0`; the README's released-checkpoint example is low-dimensional Push-T and also uses `cuda:0` ([immutable README, commit `5ba07ac`](https://github.com/real-stanford/diffusion_policy/blob/5ba07ac6661db573af695b419a7947ecb704690f/README.md#running-for-a-single-seed)). GPU VRAM and runtime are not established upstream; an image checkpoint alone was about 4.29 GB at the cutoff. `nvidia-smi` was unavailable in the revision environment, so the preflight failed; this is optional and never the no-GPU path.
5. **[JUDGMENT] Climb the nine-rung evidence ladder; buy nothing until Rung 6 passes:** Rungs 0–6 are software-only on the default CPU path. Hardware appears only in the 20 h extension, after external protocol review, HIL where relevant, legal checks, containment, and supervision (§12).
6. **[JUDGMENT] Choose one specialization at the end of month 9:** default to Track B if systems, estimation, and control appeal; choose Track A only after the exact NVIDIA pilot passes and manipulation remains the interest; choose Track C for uncertainty, assurance, and benchmark validity. The equal-hour months 10–24 substitutions are binding (§14).
7. **[FACT] Apply current Indian aviation law as a gate:** the Bharatiya Vayuyan Adhiniyam, 2024 commenced on **1 January 2025** under **S.O. 5646(E), 31 December 2024**, replacing the Aircraft Act, 1934 while §43 preserves compatible prior rules/actions ([Gazette commencement notification](https://egazette.gov.in/WriteReadData/2024/259757.pdf); [Ministry cross-check, accessed 20 October 2026](https://www.civilaviation.gov.in/our-performance)). The Drone Rules, 2021 and verified 2022/2023 amendments still require case-specific registration, pilot, airspace, insurance, import, and radio analysis (§13). This report authorizes no flight.
8. **[JUDGMENT] Spend ₹0 on hardware during the first year.** The executable default is existing-computer simulation. Scenarios B/C use uncorroborated vendor-stated foreign prices and illustrative FX arithmetic; neither is an Indian procurement budget, and landed INR, stock, GST/customs/brokerage, DGFT status, and WPC status are unresolved (§12.6).
9. **[JUDGMENT] Monitor at a planned average of about one hour a week, never more than two:** final proceedings, narrow arXiv/Scholar queries, three labs, release feeds, and Indian official notices. Delete any feed that changes no experiment or claim (§17).
10. **[FACT + JUDGMENT] Protect the full 104-week budget:** 10 h/week is exactly 1,040 hours and yields one bounded public-artifact study, one track-specific simulated thesis, and one archival artifact; 20 h/week is exactly 2,080 hours and adds deeper baselines, a required second-simulator check or equivalent independent validation, an upstream contribution, and optional contained hardware. Neither plan promises publication, employment, or a prize (§15).

### What changes with your answers

Weak mathematics assigns the full Quarter 1 foundation slice; no GPU keeps Tracks B/C on the `safe-control-gym` artifact profile, whose local result is a single-machine smoke observation with a partial manifest, and excludes Track A's faithful Diffusion Policy run and VLA fine-tuning; no safe indoor space replaces hardware Rungs 7–8 with the named software-validation substitute; a full-time job selects the 10 h plan and 30-minute monitoring mode; verified manipulation interest plus a successful GPU pilot changes the default to Track A. Choose the track at the end of month 9; §14 gives binding, equal-hour substitutions for months 10–24.

---

## 2. Start-this-week checklist

Seven sessions, **exactly 10 mandatory hours**. No purchase, wiring, propeller motion, or flight. Install only the small baseline needed for Rung 0; ROS 2, Gazebo, and PX4 wait until the month-9/10 gate.

| Session | Time | Do | Output to keep |
|---|---:|---|---|
| 1. Seven-task diagnostic | 2 h | Complete the one canonical diagnostic in §5.4. Mark every concept `explain`, `use with reference`, or `unknown`; do not look up a complete solution while testing. | Diagnostic artifacts and gap list. |
| 2. Environment inventory | 1.5 h | Record host OS, CPU cores, RAM, free SSD, Python version, and whether `nvidia-smi` works. On Ubuntu 24.04 or a disposable Linux environment, create a Python 3.12 environment and install only MuJoCo 3.16.0 from its official route. Record the resolved package and hash. Skip PyTorch unless Session 5 needs it. | Environment manifest; install command and output; explicit GPU/no-GPU classification. |
| 3. Rung 0 | 2 h | Run a fixed-seed MuJoCo pendulum or cart-pole rollout 20 times; vary seed once and CPU thread count once. If installation fails, preserve the error and complete the same deterministic check with a small NumPy first-order system. | Raw table, generated figure, discrepancy note. |
| 4. Mathematics | 1.5 h | Use *Mathematics for Machine Learning* ch. 2 or the NPTEL M0 archive for vectors/matrices; check one numerical gradient by finite differences. | Worked exercises and notebook. |
| 5. Paper memo | 1.5 h | Read the abstract, method diagram, main evaluation, limitations, and artifact README for Diffusion Policy (RL-25). Write what would be required for **image Push-T training** versus the README's **low-dimensional checkpoint evaluation**. End with `read`, `optional-GPU-reproduce`, or `drop`, not automatically `reproduce`. | One-page claim/evidence/compute memo. |
| 6. Monitoring setup | 0.5 h | Create the §17 queue header; subscribe only to `cs.RO`, `eess.SY`, and one Indian regulator source. Do not build a backlog. | Three-source list and one queue row. |
| 7. Decision gate | 1 h | Answer §4; select 10 h or 20 h and Track A/B/C provisionally; sign the no-purchase/no-flight gate; schedule next week's first two blocks. | Decision memo. |


---

## 3. The best 10 resources

Exactly ten, chosen for quality, prerequisite fit, depth, practical value, currency, and cost, and each mapped to a roadmap milestone. Scores are Q/P/D/V/C. All are free in the recommended access route unless stated.

| # | Resource (exact identity) | Purpose and milestone | Prerequisite | Time and cost | Score | Notes |
|---|---|---|---|---|---|---|
| 1 | *Mathematics for Machine Learning*, Marc Peter Deisenroth, A. Aldo Faisal, Cheng Soon Ong, Cambridge University Press, 2020; [free author PDF and exercises](https://mml-book.github.io/) | Foundation: linear algebra, vector calculus, probability, continuous optimization (chs. 2–7). Supports M0–M1 and Q1. | School mathematics, Python. | 30 h core selections; 45–70 h broad route; free. | 5/2/4/4/4 | The authors limit scope to mathematics, not modern methods. |
| 2 | *Modern Robotics: Mechanics, Planning, and Control*, Kevin M. Lynch and Frank C. Park, Cambridge University Press, 2017 (updated first-edition preprint, December 2019); [official book, videos, software, and exercises](https://hades.mech.northwestern.edu/index.php/Modern_Robotics); [book DOI](https://doi.org/10.1017/9781316661239) | Rigid-body robotics: SE(3), kinematics, dynamics, planning and control. M2/Rungs 1–3. | Calculus, linear algebra, programming. | 25 h core selections; 80–120 h broad book route; free official materials. | 5/3/4/5/3 | Coursera still names old V-REP tooling; use theory and reproduce selected outputs in the active simulator. |
| 3 | [*Control Engineering for Robotics*, Prof. Chayan Bhawal, IIT Guwahati, NPTEL, January–April 2026 run](https://onlinecourses.nptel.ac.in/noc26_ee02/preview); [permanent course and video record](https://nptel.ac.in/courses/108103863) | Control: modeling, PID, state space, controllability/observability, pole placement, LQR. M3; feeds Rung 1 acceptance. | M0–M2 mathematics and dynamics. | 25 h mandatory extract; ≈80 h broad route; free; optional ₹1,000 2026 certificate. | 4/3/4/4/5 | Pair with *Feedback Systems* (§9) for derivations. |
| 4 | *State Estimation for Robotics*, second edition, Timothy D. Barfoot, Cambridge University Press, published online 11 January 2024; [book DOI](https://doi.org/10.1017/9781009299909); [author-hosted legal copy](https://asrl.utias.utoronto.ca/~tdb/bib/barfoot_ser24.pdf) | Estimation: Bayes filters, batch nonlinear least squares, Lie groups and robust losses. Rung 2; mandatory 6-hour Track-C branch or reference for B. | Linear algebra, probability, optimization basics. | 6 h branch extract; 60–110 h advanced route; free author copy. | 5/5/5/5/5 | High prerequisite; use the short-course lectures before advanced chapters. |
| 5 | [ROS 2 Jazzy official tutorials](https://docs.ros.org/en/jazzy/Tutorials.html) ([index source revised 14 May 2026](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials.rst)) | Integration: nodes, topics, services/actions, TF2, launch, QoS, recording/replay. M5/Rung 3. | Linux shell, Python or C++. | 10 h core selections; 45–60 h broad route; free. | 5/2/3/5/5 | Official versioned path; rendered docs showed an anti-bot challenge, so repository source supplied the audit. |
| 6 | [*Principles of Perception and Planning for Aerial Vehicles*, Prof. K. Madhava Krishna, Prof. Harikumar Kandath, Prof. Antony Thomas, IIIT Hyderabad, NPTEL, July–October 2026 run](https://onlinecourses.nptel.ac.in/noc26_ae22/preview); [52-lecture record](https://nptel.ac.in/courses/101106001) | Aerial autonomy: rigid-body motion, Kalman/GPS-INS fusion, SLAM, camera geometry, planning, MPC, ROS 2, PX4/Gazebo. M10/Rung 4. | Linear algebra, calculus; controls desirable. | 10 h mandatory extract; ≈80 h broad project route; free; 2026 certificate was optional ₹1,000. | 4/3/4/5/5 | Public outline has lectures, not a complete graded coding project; Rung 4 supplies one. |
| 7 | [*Deep Learning for Computer Vision*, Prof. Vineeth N. Balasubramanian, IIT Hyderabad, NPTEL, July–October 2026 run](https://onlinecourses.nptel.ac.in/noc26_cs174/preview); [permanent record](https://nptel.ac.in/courses/106106224) | Learned perception, PyTorch, calibration and shift analysis. M7. | Basic ML, probability, linear algebra, Python; Assignment 0 is the readiness test. | 15 h mandatory extract; ≈95 h broad route; free; optional ₹1,000 2026 certificate. | 4/3/4/5/5 | Stanford CS231n (§8) is deeper but its 2026 recordings are restricted. |
| 8 | "Safe-Control-Gym: A Unified Benchmark Suite for Safe Learning-Based Control and Reinforcement Learning in Robotics", Zhaocong Yuan, Adam W. Hall, Siqi Zhou, Lukas Brunke, Melissa Greeff, Jacopo Panerati, Angela P. Schoellig, *IEEE Robotics and Automation Letters* 7(4), 2022; [DOI](https://doi.org/10.1109/LRA.2022.3196132); [verified artifact release `v1.0.0`](https://github.com/learnsyslab/safe-control-gym/releases/tag/v1.0.0); [immutable commit `dd1b293`](https://github.com/learnsyslab/safe-control-gym/tree/dd1b293f3be1f3df56bb26cb66753e250afda00a) | CPU artifact study mapped to the paper's 2-D quadrotor tracking Figures 5–6; the health check evaluates PPO. A full Figure-5 recreation needs LQR, mismatched LQR, GP-MPC, PPO, and SAC; PID/CBF work is a separately labeled extension. Feeds Rungs 2, 5, and Track C. | Python, basic control and probability; RL only for retraining. | 6–8 h paper/artifact study; 75 h 10-hour-path study; software free, 5 GB storage ceiling. | 5/3/4/5/4 | `v1.0.0` contains the command, evaluator, configs, and checkpoint. The README CPU command arguments produced a **single-machine smoke observation with a partial manifest** in 4.607 s for one 250-step episode after disclosed dependency fixes and a headless plotting setting; `average_rmse=0.311`. This checks executability, not the full paper result. The release tag calls the package 2.0.0 and its build backend is not frozen, so create and preserve a complete resolved manifest before treating the observation as reproducible. |
| 9 | "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", Cheng Chi, Siyuan Feng, Yilun Du, Zhenjia Xu, Eric Cousineau, Benjamin CM Burchfiel, Shuran Song, *Robotics: Science and Systems XIX*, 10 July 2023; [DOI](https://doi.org/10.15607/RSS.2023.XIX.026); [project/data](https://diffusion-policy.cs.columbia.edu/); [immutable artifact snapshot](https://github.com/real-stanford/diffusion_policy/tree/5ba07ac6661db573af695b419a7947ecb704690f) | Robot-learning mechanism and Track-A GPU reproduction only. Image Push-T training and low-dimensional checkpoint evaluation are distinct tasks. | Imitation learning and diffusion basics; Linux plus a CUDA-11.6-compatible NVIDIA GPU for the author path. | 8–10 h reading; reproduction runtime and accelerator cost **not established**; software is free. | 5/4/4/4/4 | Author environment: Python 3.9, PyTorch 1.12.1, CUDA 11.6, PyMunk 6.2.1. It is not MuJoCo or CPU-verified. Image checkpoint ≈4.29 GB; low-dimensional example ≈1.04 GB. Preflight smoke test failed because `nvidia-smi` was unavailable in this environment. |
| 10 | *Underactuated Robotics: Algorithms for Walking, Running, Swimming, Flying, and Manipulation*, Russ Tedrake, MIT; [living notes](https://underactuated.csail.mit.edu/) and [complete Spring 2024 lecture playlist](https://www.youtube.com/playlist?list=PLkx8KyIQkMfU5szP43GlE_S1QGSPQfL9s) | Advanced model-based control: quadrotor LQR, Lyapunov and barrier ideas, trajectory optimization, MPC, robust control. Track B/C reference depth. | Dynamics, linear algebra, optimization, basic control (after M2–M3). | 5 h core selection; 65 h broader selected route; free. | 5/5/5/5/3 | APIs and lectures are 2024. Drake examples are optional because no Drake version was integration-tested or made mandatory in this roadmap. |

---

## 4. Personalization questions and decision rules

Answer these in writing during Session 7. The unpersonalized roadmap is not equally good for everyone; each cluster changes an entry month, resource tier, hardware gate, or track.

| # | Question | Decision rule |
|---|---|---|
| 1 | Can you, today, compute a least-squares fit and explain eigenvalues, Jacobians, and conditional probability without notes? | Fewer than two of three → use the full 30-hour M0 core slice and diagnosed MIT 18.06SC/18.05 exercises inside Q1; do not start ROS before Q1 passes. All three → challenge the M0 outputs, then reassign at most 15 saved hours to Rung 1; never skip the gate. |
| 2 | How comfortable are you with Linux, Python, and C++ (none / use / fluent)? | Linux or Python below `use` → month 1 is tooling practice before any robotics content. C++ `none` is acceptable until Rung 3; add a small C++ exercise in the 20 h plan. |
| 3 | Have you trained and evaluated a neural network with held-out data and multiple seeds? | No → take the 5-hour M6 primer and 15-hour M7 core slice, then spend the already-budgeted Rung 5/6 implementation hours on the baseline. Yes with documented seeds and split hygiene → challenge M6 and move its five hours to M7, without increasing total F hours. |
| 4 | Have you implemented any feedback controller or state estimator? | No → keep all Rung 1/2 hours and the 25-hour M3 core slice; use the Bonn lecture within M3, not on top. Yes with a reproducible artifact → challenge at most 10 M3 hours and move them to the same quarter's Rung 1 disturbances. |
| 5 | Degree and career stage (student / early-career engineer / mid-career / other)? | Student with access to faculty → pursue the research-master's or RA route at month 18 (§16). Mid-career with income needs → systems/evaluation-engineer route and the 10 h plan. |
| 6 | Have you written a technical report or paper that someone else reviewed? | No → monthly two-page memos start in month 1 and the month-15 artifact/reproduction-boundary report is mandatory before the confirmatory thesis experiment. |
| 7 | Hours per week you can protect for 104 weeks (not a best week)? | ≤12 → 10 h plan. ≥18 → 20 h plan. Between → follow the 10 h contract; treat surplus as recovery or choose one 20 h extension only by logging the extra hours separately. Never claim the 1,040-hour completion if hidden overtime was used. |
| 8 | Budget in INR over 24 months for hardware and fees? | Any budget → Scenario A until Rung 6. Scenarios B and C remain **illustrative foreign-goods arithmetic, not orderable Indian budgets**, regardless of the nominal INR conversion. Compare written landed Indian quotes with institutional access only after every §12.6 field is complete; no unverified rupee threshold routes a purchase. |
| 9 | Computer: CPU cores, RAM, free SSD, discrete GPU and VRAM? | No NVIDIA GPU → choose Track B or C and use the `safe-control-gym` `v1.0.0` artifact study, whose local result is a **single-machine smoke observation with a partial manifest**; do not call a checkpoint-only run a full-paper reproduction. No Diffusion Policy author run, VLA fine-tuning, or Isaac Sim. OpenVLA's repository reported ≈27 GB GPU memory for LoRA; Isaac Sim's official minimum was RTX 4080/16 GB. Any GPU → first run the exact Track-A pilot and record peak VRAM/runtime; Track A becomes feasible only if that pilot fits. |
| 10 | Do you have access to a lab, makerspace, or mentor who can inspect your work? | No → use the three-role mentor board in §16 via reproductions and issues; prefer Track B or C, which need no physical facility. Yes → Rung 7–8 can be scheduled in the 20 h plan. |
| 11 | Do you have a safe indoor enclosure or institutional flight space? | No → Rung 8 drone hardware is removed; hardware questions route to a tabletop arm or an institution. Never substitute outdoor flight. |
| 12 | City/state, and can you travel for supervised test days? | Near IISc/ARTPARK (Bengaluru), IIIT Hyderabad, IIT Kanpur/Bombay/Madras → investigate seminars and collaboration leads in §14 and §16. Remote → remote testbeds and online reproductions. |
| 13 | Comfort with electronics and mechanics (none / hobby / trained)? | None → M4 stays simulation/literacy-only and any bench work is supervised. Trained → replace M4's 10-hour core/5-hour extension with equal-hour extracts from the UT Austin embedded course; do not add its full 72 hours. |
| 14 | Which problem pulls you: manipulation, flight, legged/humanoid, evaluation and safety, scientific robotics? | Manipulation → Track A if Q9 and Q10 are favourable. Flight → Track B. Evaluation/safety → Track C. Humanoid → Track A in simulation only (HumanoidBench); humanoid hardware is out of individual scope. Scientific robotics → Track C with the F12 entry experiment. |
| 15 | Theory versus building (prefer derivations / prefer systems / both)? | Derivations → Track C and the 5-hour M11 safety/control extract, plus only the 20 h plan's allocated extension. Systems → Track B and the already-budgeted Rungs 3–4. |
| 16 | Career target in five years (industry research engineer / PhD / startup / academic)? | PhD → month-18 route decision requires letters and a thesis protocol; publish a reproduction first. Startup → add the IERA/commercialization lens in §18 but do not skip the evidence ladder. |
| 17 | When do you want a first external review or submission? | < 12 months → submit a reproduction or negative-result report to a workshop or technical-report venue; do not promise a method paper. 18–24 months → the plan's month-22–23 manuscript. |
| 18 | Any constraints from employer, institution, or law (IP, export, flight, data)? | Any → write them into the protocol at month 13 and the ethics checklist in §16; employer IP rules can determine whether artifacts can be released. |

---

## 5. Field map, definitions, and competency model

### 5.1 Working definitions

| Term | Working definition (paraphrased) | Anchor and label |
|---|---|---|
| Robot | A programmed, actuated mechanism with a degree of autonomy that performs locomotion, manipulation, or positioning; a mobile robot travels under its own control. | ISO 8373 vocabulary as reproduced by the [International Federation of Robotics standardisation page](https://ifr.org/standardisation) (undated; accessed 2026-10-20). **[FACT, medium confidence]**: the ISO landing pages returned HTTP 403, so the controlling text was not opened. |
| Robotics | The discipline that designs, models, builds, controls, and evaluates robots; ISO/TC 299 standardizes its vocabulary, safety, and performance. | Same IFR page. **[JUDGMENT]** on scope. |
| Embodied AI | AI research where agents learn from egocentric interaction with environments, frequently simulated; canonical tasks are visual exploration, navigation, and embodied question answering. | ["A Survey of Embodied AI: From Simulators to Research Tasks", Duan et al., IEEE TETCI, 2022](https://doi.org/10.1109/TETCI.2022.3141105). **[FACT]** for the framing; **[JUDGMENT]** that "embodied" often means simulation-only. |
| Physical AI | In 2025–2026 preprints: systems that perceive, reason, act, and learn through physical interaction under partial observability, uncertain dynamics, embodiment constraints, and real-time limits, organized as a closed loop. Also a vendor platform label. | [Gao et al., "Physical AI: A Survey of Models, Learning, Systems, and Open Challenges", arXiv v2, 17 October 2026](https://arxiv.org/abs/2610.21171); [Salehi, "Fundamentals of Physical AI", 12 November 2025](https://arxiv.org/abs/2511.09497); [Oh, "A Tutorial on World Models and Physical AI", 11 June 2026](https://arxiv.org/abs/2606.12783); vendor usage in [NVIDIA Cosmos platform listing, January 2025](https://arxiv.org/abs/2501.03575). **[UNCERTAIN]**: no standards-body definition found; **[HYPE/DEMO]** for vendor usage. Operationally: embodied AI + robotics systems engineering + safety and compute. |
| Unmanned aircraft / UAS / drone | An aircraft operated without the possibility of direct human intervention from within or on it; a UAS adds the control elements and links needed to operate it. The US regulator uses "drone" and "UAS" interchangeably. Autonomy is a capability layered on a UAS, not part of the legal definition. | [49 U.S.C. § 44801, amended 16 May 2024](https://www.law.cornell.edu/uscode/text/49/44801); [FAA UAS page](https://www.faa.gov/uas). **[FACT]** for US wording; India's definitions (model RPAS, weight classes) are in §13. |

**[JUDGMENT]** Every autonomous drone is a mobile robot under the ISO vocabulary, but drones are the one embodiment class governed by aviation law in addition to product-safety norms. Search the literature under "robot learning", "embodied AI", "autonomous systems", and "aerial robotics"; treat "physical AI" as a 2025–2026 umbrella term and vendor "physical AI" pages as product descriptions.

### 5.2 Embodiments and maturity

| Embodiment | Representative verified anchors | Maturity **[JUDGMENT]** |
|---|---|---|
| Fixed-base single/dual-arm manipulation | Diffusion Policy (RSS 2023); OpenVLA (CoRL 2024); DROID (RSS 2024); LIBERO; CALVIN | Best-benchmarked; still fragile under perturbation (§6, F2). |
| Multi-fingered dexterous hands with tactile sensing | Contact-Grounded Policy, ViTacFormer, LightTact (RSS 2026) | Hardware-expensive, single-lab results, young benchmarks. |
| Mobile manipulation / whole-body | KinDER (RSS 2026) | Few standardized benchmarks; long-horizon evaluation immature. |
| Legged / humanoid | HumanoidBench (RSS 2024); Ψ0 (RSS 2026); vendor reports | Simulation benchmarks open; real-world generality unproven; vendor claims dominate discourse. |
| Aerial (multirotor) | Swift (Nature 2023); Agilicious (Science Robotics 2022); RSS 2026 adaptation and navigation papers | Strong peer-reviewed results in controlled or chosen environments; weather, recovery, certification open. |
| Aerial manipulation | Survey (T-RO 2022); aerial additive manufacturing (Nature 2022); continuum and soft manipulators (2024–2025) | Lab-scale prototypes. |
| Soft / continuum | Soft-robotics roadmap (2022); RSS 2026 self-modeling and design papers | Modeling, sensing, durability, and benchmarks all open. |
| Multi-robot / swarm | EGO-Swarm (ICRA 2021); RACER (T-RO 2023); HJB-informed safe navigation on Crazyflies (RSS 2026) | Indoor, motion-capture-aided, or small-team results dominate. |
| Human-interactive / assistive | SHREC benchmark; engagement-aware MPC; reachability-aware assistance (RSS 2026) | Small-N user studies; social reasoning gaps documented. |
| Scientific / field robotics | Mobile robotic chemist (Nature 2020); A-Lab and Coscientist (Nature 2023) | Automation demonstrated; "new science produced by autonomy" contested (F12). |
| Simulated embodied agents | Habitat, ProcTHOR, BEHAVIOR-1K, RoboCasa | Core substrate of embodied-AI research; no hardware. |

### 5.3 System layers

Mechanics and electronics → sensing and calibration → geometry and perception → estimation and mapping → planning and decision making → dynamics and control → learning and adaptation → real-time and distributed systems → verification, safety, and human factors → data and experimental science. A research result usually lives in one or two layers; a deployed system needs all ten. The curriculum (§8) walks these layers in dependency order, and the project ladder (§12) adds one layer per rung.

### 5.4 Competency matrix

**[JUDGMENT]** Nineteen competencies with four observable levels. Each cell is a demonstration, not a self-rating. The mathematics list follows the areas named as college-level mathematics in [ABET's 2025–2026 engineering criteria](https://www.abet.org/accreditation/accreditation-criteria/criteria-for-accrediting-engineering-programs-2025-2026/) (calculus, differential equations, probability, statistics, linear algebra, discrete mathematics), and the communication requirement follows those criteria and the speaking-and-writing qualifier on the [CMU Robotics Institute MS curriculum page](https://www.ri.cmu.edu/education/academic-programs/master-of-science-robotics/curriculum/).

| # | Competency | Literacy | Implement | Integrate | Research |
|---|---|---|---|---|---|
| 1 | Linear algebra | Explain why rotation matrices are orthogonal and what a Jacobian does | Code forward kinematics and a least-squares pose fit; match a library to 1e-6 | Find and fix a frame-convention bug using covariances and residual plots | Propose and test a new geometric representation or estimator with ablations |
| 2 | Calculus and ODEs | Read pendulum and cart-pole equations of motion | Integrate quadrotor dynamics with two integrators; quantify error versus step size | Run gradient checks through a differentiable simulator in a training loop | Bound smoothing error in contact gradients |
| 3 | Probability and statistics | Explain confidence intervals and why multiple seeds matter | Compute bootstrap intervals over rollouts | Pre-register a comparison with power analysis; report per-seed variance | Derive an estimator for real-world performance from mixed-fidelity data |
| 4 | Optimization | Distinguish convex from nonconvex problems and constraint types | Implement LQR and a direct-collocation trajectory optimizer | Run sampling or gradient MPC at control rate on a simulated quadrotor | Contribute a contact-implicit or certifiable method |
| 5 | Mechanics and dynamics | Explain underactuation with the acrobot and quadrotor | Derive and simulate a legged or multirotor model; check energy conservation | Identify model parameters from logs; quantify residuals | Model multi-link contact for in-hand manipulation |
| 6 | Signals | Explain aliasing, latency, event-camera output | Build filters for IMU/tactile streams; detect slip | Synchronize heterogeneous sensors; measure end-to-end latency | Design new sensing representations |
| 7 | Control | Explain feedback, stability margins, and why PID fails on agile flight | Tune LQR/geometric controllers for a simulated quadrotor and arm | Combine nominal control, a learned residual, and a safety filter in SITL | Bound adaptation under disturbances |
| 8 | Estimation and Kalman filtering | Explain predict/update and observability | Implement an EKF for a planar robot with landmarks | Run a VIO/SLAM stack on EuRoC-style data; report drift and failures | Learned covariances or delay-robust estimators |
| 9 | Planning | Explain RRT, A*, and task-and-motion planning | Implement RRT* and a kinodynamic planner | Integrate planner, controller, and perception in ROS 2 | Benchmark physical reasoning across paradigms |
| 10 | Vision | Explain camera models, epipolar geometry, domain shift | Train a detector; calibrate a camera; track features | Build perception robust to lighting and distractors; measure degradation curves | Event-based or active perception methods |
| 11 | ML and deep learning | Explain pretraining, fine-tuning, overfitting | LoRA-fine-tune a VLM-based policy on one GPU | Build data, training, and evaluation harness for a multi-task policy | Co-training and data-recipe studies with statistics |
| 12 | RL and imitation | Explain BC, policy gradient, offline RL, reward hacking | Reproduce Diffusion Policy on Push-T; run PPO on a simulated task | Train in simulation and transfer with domain randomization; log sim-real gaps | New policy classes or continual-learning methods with real evaluation |
| 13 | Embedded systems and ROS 2 | Explain nodes, topics, QoS, real-time constraints | Close a control loop against PX4 SITL from a ROS 2 node | Profile latency end to end; handle time sync and loss | System contributions to open stacks |
| 14 | Simulation | Explain physics engines, rendering, sim-to-real gap | Build a MuJoCo task; randomize dynamics and visuals | Reconstruct a real scene; compare policy rankings | Learned simulators and evaluation theory |
| 15 | Mechatronics | Read datasheets; explain motor, ESC, battery, sensor limits | Bring up an open-hardware platform safely | Instrument a platform with logging and failsafes | Novel sensors, grippers, morphologies |
| 16 | Safety and verification | Explain safety filters and why demos are not safety evidence | Implement a CBF filter in safe-control-gym; count violations | Add runtime monitoring and recovery; report a failure taxonomy | Calibrated safety assessment or certifiable synthesis |
| 17 | Scientific method | Explain why one run is not a result | Report intervals across seeds; ablate one component | Pre-register metrics; replicate a published result | Multi-lab replication protocols |
| 18 | Writing and communication | Summarize a paper's claim, evidence, and limits in one page | Write a reproducible README and experiment memo | Write a workshop-quality paper with checkable figures | Peer-review-quality writing and reviewing |
| 19 | Ethics and responsibility | Explain consent, data licensing, dual use | Write a model/data card with limitations | Run a user study under an ethics protocol | Contribute to safety or governance evidence |

**Dependency order [JUDGMENT]:** mathematics (1–4) → mechanics, signals, probability (5, 6, 3) → control and estimation (7, 8) → planning and vision (9, 10) → ML and RL/IL (11, 12). ROS 2 and simulation (13, 14) start early in parallel. Mechatronics (15) waits for a simulation milestone. Safety, scientific method, writing, and ethics (16–19) run continuously.

**Self-diagnostic (the same seven tasks used in Week 1):** (1) implement matrix multiplication, least squares, and a seeded noisy-line fit with Python arrays; (2) explain vectors, matrices, derivatives, integrals, probability, mean, variance, and conditional probability in plain language; (3) simulate a first-order step response with units; (4) extract rate, range, resolution, units, and interface from one sensor datasheet; (5) define force, torque, mass, inertia, voltage, current, power, PWM, feedback, latency, and aliasing in one sentence each; (6) reproduce the same numerical table from a clean environment within a declared floating-point tolerance; (7) write a 500-word question–method–result–limitation–next-step memo. **Routing:** failure on 1, 3, or 6 → Month 1 numerical/tooling remediation; more than half of the concepts in 2 or 5 marked `unknown` → use the full Q1 foundation allocation; otherwise start the core but challenge out only through its required artifact. This diagnostic never routes directly to hardware or skips a quarterly gate.

---

## 6. Verified frontier and open problems

Twelve clusters. Each gives scope, evidence, unresolved work, counterevidence, maturity/replication, competencies, an entry experiment, constraints, and a falsifiable question. **Publication identity is a fact; a paper's reported result is attributed to its authors.** Each quantitative result below names its locator and access level. `Official abstract` means the result was not checked against a table or appendix and is therefore **[UNCERTAIN]** for decision-making; full-text locators are named explicitly. Independent confirmation of any author's “first,” “best,” or “state of the art” was not found and those words are not adopted. Full bibliographic details for spine readings appear in §7.

### F1. Data-efficient robot learning and real-world data quality

- **Evidence [FACT for bibliographic identity; UNCERTAIN for single-family counts/effects].** In their final-paper abstracts, the authors report: "DROID: A Large-Scale In-The-Wild Robot Manipulation Dataset" (Alexander Khazatsky et al., final RSS XX paper, July 2024) contains 65k trajectories/350 h across 564 scenes and 86 tasks ([official DOI/abstract locator](https://www.roboticsproceedings.org/rss20/p120.html)); "RoboMIND: Benchmark on Multi-embodiment Intelligence Normative Data for Robot Manipulation" (Kun Wu et al., final RSS XXI paper, June 2025) contains 107k trajectories, 479 tasks, four embodiments, and 5k failure demonstrations ([official DOI/abstract locator](https://www.roboticsproceedings.org/rss21/p152.html)); "A Systematic Study of Data Modalities and Strategies for Co-training Large Behavior Models for Robot Manipulation" (Fanqi Lin et al., final RSS XXII paper, 13 July 2026) reports 89 policies, 4,000 h of source data, 58,000 simulated and 2,835 real rollouts, with cross-embodiment gains but no statistically significant discrete-token benefit ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p007.html)); and "EgoVerse: An Egocentric Human Dataset for Robot Learning from Around the World" (Ryan Punamiya et al., final RSS XXII paper, 13 July 2026) reports 1,362 h and a multi-lab transfer study whose gains depend on task alignment ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p092.html)). Counts were not independently audited; the co-training effects remain one-family results.
- **Unsolved.** Which data mixture is worth its collection cost for a given embodiment; data-quality measures beyond hours; whether failure data helps.
- **Counterevidence [UNCERTAIN, authors' final-abstract comparison].** "Ψ0: An Open Foundation Model Towards Universal Humanoid Loco-Manipulation" (Songlin Wei et al., final RSS XXII paper, 13 July 2026) reports that about 800 h of curated egocentric video plus 30 h of robot data beat baselines using more than ten times the heterogeneous data ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p021.html)), whereas Lin et al. report cross-embodiment co-training gains. Different embodiments and protocols prevent a direct comparison; “more diverse data is better” is not settled.
- **Maturity.** Datasets open; recipes are single-lab with large internal evaluations; EgoVerse is the only explicit cross-lab replication found. High confidence that the question is open.
- **Competencies.** 3, 11, 12, 17. **Entry experiment.** Fine-tune one open policy (Octo or OpenVLA class) on a fixed simulated task with three data budgets and two mixtures; report success with seed-level intervals and a pre-registered stopping rule. **Constraints.** GPU time; dataset licenses; no hardware.
- **Falsifiable question.** For a fixed robot and task family, does adding N hours of cross-embodiment data improve closed-loop success more than adding N/10 hours of target-robot data?

### F2. Vision-language-action (VLA) and generalist policies, including cross-embodiment transfer

- **Evidence [FACT for final records; UNCERTAIN for author-reported performance].** Final records establish the sequence from "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control" (Brianna Zitkovich et al., CoRL 2023/PMLR 229) through Open X-Embodiment, Octo, OpenVLA, and π0 ([RT-2 final PMLR record](https://proceedings.mlr.press/v229/zitkovich23a.html); [Open X-Embodiment final ICRA 2024 DOI](https://doi.org/10.1109/ICRA57147.2024.10611477); [Octo final RSS XX DOI](https://doi.org/10.15607/RSS.2024.XX.090); [OpenVLA final CoRL 2024/PMLR 270 record](https://proceedings.mlr.press/v270/kim25c.html); [π0 final RSS XXI DOI](https://doi.org/10.15607/RSS.2025.XXI.010)). OpenVLA's abstract reports a 7B model trained on 970k demonstrations and a 16.5-point advantage over RT-2-X across 29 tasks; that is a single author-family result, not an independently confirmed ranking. "TinyVLA: Toward Fast, Data-Efficient Vision-Language-Action Models for Robotic Manipulation" (Junjie Wen et al., final RA-L 10(4), April 2025) reports faster inference and comparable success without pretraining in its abstract ([DOI/abstract record](https://doi.org/10.1109/LRA.2025.3544909)).
- **Unsolved.** Robustness to visual and spatial perturbation; grounding; latency; whether "cross-embodiment" is more than fine-tuning convenience; comparability across papers.
- **Counterevidence [FACT for publication; UNCERTAIN for abstract-level quantitative results].** "LIBERO-X: Robustness Litmus for Vision-Language-Action Models" shows large drops for representative VLAs under cumulative spatial, object, and instruction perturbations ([Guodong Wang et al., final RSS XXII paper, July 2026](https://doi.org/10.15607/RSS.2026.XXII.097)). "Vision–Language–Action Models for Robotic Manipulation: A Critical Review of Design Choices, Evidence, and Emerging Frontiers" audits 20 VLA systems and 8 benchmark studies and concludes that LIBERO, SimplerEnv, and CALVIN cannot support deployment-level claims ([Linh Manh Nguyen Dinh et al., *Robotics* 15(10), 19 October 2026](https://doi.org/10.3390/robotics15100203); abstract/metadata access). The preprint "Look Before You Act: Bridging Active Perception and Vision-Language-Action Models via Observation-Aligned Data Adaptation" reports in its arXiv abstract that π0.5 LIBERO success fell from 46.3% to 11.5% under perturbed starts ([Jiawei Geng et al., arXiv:2610.23378, 16 October 2026](https://arxiv.org/abs/2610.23378)). "The Yes-Man Syndrome: Benchmarking Abstention in Embodied Robotic Agents" reports in its arXiv abstract that an embodied planner abstained on only 16.5% of 6,069 infeasible or ambiguous instructions ([Doguhan Yeke et al., arXiv:2605.20544, 19 May 2026](https://arxiv.org/abs/2605.20544)).
- **[HYPE/DEMO].** The maker-authored reports "GR00T N1: An Open Foundation Model for Generalist Humanoid Robots" ([NVIDIA authors, arXiv:2503.14734](https://arxiv.org/abs/2503.14734)), "Gemini Robotics: Bringing AI into the Physical World" ([Gemini Robotics Team, arXiv:2503.20020](https://arxiv.org/abs/2503.20020)), and "Gemini Robotics 1.5: Pushing the Frontier of Generalist Robots with Advanced Embodied Reasoning, Thinking, and Motion Transfer" ([Gemini Robotics Team, arXiv:2510.03342](https://arxiv.org/abs/2510.03342)), plus Figure's promotional ["Helix: A Vision-Language-Action Model for Generalist Humanoid Control" page](https://www.figure.ai/news/helix), are closed or partly closed self-evaluations. Third-party work does not replicate their headline claims: "CLIFT: Turning Gemini Robotics On-Device into Humanoid Specialists via Non-Invasive Closed-Loop Iterative Fine-Tuning" reports direct API fine-tuning short of deployment-level mastery ([Yuxin Chen et al., arXiv:2607.29172, 31 July 2026](https://arxiv.org/abs/2607.29172)); "SaPaVe: Towards Active Perception and Manipulation in Vision-Language-Action Models for Robotics" reports in its arXiv abstract that its own method beat GR00T N1 and π0 by up to 31.25% on its authors' tasks ([Mengzhen Liu et al., arXiv:2603.12193, 12 March 2026](https://arxiv.org/abs/2603.12193)). Missing evidence: third-party closed-loop evaluation on shared tasks.
- **Maturity.** Open models: code and weights available; closed vendor models: closed artifacts. Robustness gap: high confidence (three independent families).
- **Competencies.** 10, 11, 12, 14, 17. **Entry experiment.** Reproduce one published OpenVLA or Octo number on LIBERO or SimplerEnv, then rerun under LIBERO-X-style perturbations and plot the degradation curve. **Constraints.** One consumer GPU for LoRA; no real robot needed.
- **Falsifiable question.** Does a VLA fine-tuned with LoRA on 50 demonstrations retain at least 80% of nominal success under a fixed perturbation suite, and does that retention predict real-robot success within a stated tolerance?

### F3. Long-horizon planning, memory, recovery, and closed-loop evaluation

- **Evidence [FACT for records; UNCERTAIN for abstract-level outcomes].** "CALVIN: A Benchmark for Language-Conditioned Policy Learning for Long-Horizon Robot Manipulation Tasks" (Oier Mees et al., final RA-L 7(3), July 2022) and "FurnitureBench: Reproducible Real-World Benchmark for Long-Horizon Complex Manipulation" (Minho Heo et al., final RSS XIX, 10 July 2023) establish public long-horizon benchmark families; FurnitureBench's abstract reports that its offline RL and imitation baselines were insufficient ([CALVIN DOI](https://doi.org/10.1109/LRA.2022.3180108); [FurnitureBench official proceedings abstract](https://www.roboticsproceedings.org/rss19/p041.html)). Current proposals include "BagelVLA: Enhancing Long-Horizon Manipulation via Interleaved Vision-Language-Action Generation" (Yucheng Hu et al.), "From Reaction to Anticipation: Proactive Failure Recovery through Agentic Task Graph for Robotic Manipulation" (Sheng Xu et al.), and "Visual Verification Enables Inference-time Steering and Autonomous Policy Improvement" (Mingtong Zhang and Dhruv Shah), all final RSS XXII papers published 13 July 2026 and audited at abstract level ([BagelVLA](https://www.roboticsproceedings.org/rss22/p083.html); [AgentChord paper](https://www.roboticsproceedings.org/rss22/p180.html); [visual verification paper](https://www.roboticsproceedings.org/rss22/p079.html)).
- **Unsolved.** Memory over minutes; recovery without replanning latency; metrics separating completion from safe execution; whether offline scores predict closed-loop behavior.
- **Counterevidence.** The 2026 critical review lists long-horizon breakdown as recurring; TAIL-Safe reports flow-matching and diffusion imitation policies failing in-distribution because of initial-condition sensitivity and compounding drift ([Ahmed and Begum, RSS 2026](https://doi.org/10.15607/RSS.2026.XXII.207)). 2026 preprint titles such as LIBERO-RECOVER and LongBench signal that recovery evaluation is still being defined (titles only; not read).
- **Maturity.** Benchmarks open; recovery methods single-lab and unreplicated. High confidence that recovery is open.
- **Competencies.** 9, 11, 12, 16, 17. **Entry experiment.** With declared GPU access, run a policy already supported by CALVIN or FurnitureSim, log the failing stage, build a failure taxonomy, and add a monitor-and-retry wrapper; without a GPU, evaluate a released checkpoint if its documented environment fits. Do not call a port or reduced model a reproduction. **Constraints.** Simulation only; compute and artifact compatibility must be recorded before the run.
- **Falsifiable question.** Does an explicit recovery-branch library raise 10-stage completion more than doubling demonstrations at equal compute?

### F4. Contact-rich, tactile, deformable, dexterous, soft, and continuum manipulation

- **Evidence [FACT for final/preprint identity; UNCERTAIN for authors' abstract-level outcomes].** Final RSS XXII papers published 13 July 2026 include "Contact-Grounded Policy: Dexterous Visuotactile Policy with Generative Contact Grounding" (Zhengtong Xu et al.), "TACTIC: Tactile and Vision Conditioned Contact-Centric Control for Whole-Arm Manipulation" (Rishabh Madan et al.), "ViTacFormer: Learning Cross-Modal Representation for Visuo-Tactile Dexterous Manipulation" (Liang Heng et al.), and "LightTact: A Visual-Tactile Fingertip Sensor for Deformation-Independent Contact Sensing" (Changyi Lin et al.); each was checked through the official proceedings abstract, not a result table ([CGP](https://www.roboticsproceedings.org/rss22/p005.html); [TACTIC](https://www.roboticsproceedings.org/rss22/p060.html); [ViTacFormer](https://www.roboticsproceedings.org/rss22/p129.html); [LightTact](https://www.roboticsproceedings.org/rss22/p193.html)). The tactile-data lines "Tactile Beyond Pixels" (Carolina Higuera et al., arXiv preprint, 17 June 2025) and "TactiDex" (Suting Ni et al., arXiv preprint, 10 July 2026) remain preliminary ([Sparsh-X preprint](https://arxiv.org/abs/2506.14754); [TactiDex preprint](https://arxiv.org/abs/2607.09190)). Independent model-based evidence comes from "Dynamic On-Palm Manipulation via Controlled Sliding" (William Yang and Michael Posa, final RSS XX, July 2024), while the 2022 peer-reviewed soft-robotics roadmap independently lists modeling, control, sensing, and materials as open ([on-palm DOI](https://doi.org/10.15607/RSS.2024.XX.012); [roadmap DOI](https://doi.org/10.1088/2399-7532/ac4c95)).
- **Unsolved.** Contact state under occlusion; durable sensors; simulation of friction, slip, and soft bodies; hand/sensor-comparable benchmarks.
- **Counterevidence.** The CGP authors themselves call multi-finger contact-rich manipulation an open challenge; TACTIC reports learned rollouts becoming physically inconsistent under shift because multi-link contacts are sparse in data. Several first and improvement claims rest on their own families only.
- **Maturity.** Mostly code-only or unknown; hardware-specific; no independent replication found. High confidence the cluster is open.
- **Competencies.** 1, 2, 4, 5, 6, 12, 15, 16. **Entry experiment.** In MuJoCo, reproduce an in-hand reorientation RL result with domain randomization; measure sensitivity to friction coefficient and solver parameters; add simulated tactile observations and test success under sensor noise. **Constraints.** Hands and tactile sensors are costly; simulation first; pinch and crush hazards.
- **Falsifiable question.** Does tactile input improve success on an occluded in-hand reorientation task more than doubling visual data, under matched demonstration counts?

### F5. World models, learned and accelerated simulation, synthetic data, and sim-to-real validity

- **Evidence [FACT for identity; UNCERTAIN for authors' reported correlations and performance].** "DINO-WM: World Models on Pre-trained Visual Features enable Zero-shot Planning" (Gaoyue Zhou et al., arXiv preprint first posted 7 November 2024, revised 1 February 2025) remains a preprint because its venue was not verified ([arXiv abstract](https://arxiv.org/abs/2411.04983)). Final RSS XXII papers published 13 July 2026 include "Interactive World Simulator for Robot Policy Training and Evaluation" (Yixuan Wang et al.), "PolaRiS: Scalable Real-to-Sim Evaluations for Generalist Robot Policies" (Arhan Jain et al.), and "Betting for Sim-to-Real Performance Evaluation" (Yujia Chen, Zaid Mahboob, Bowen Weng). Their official abstracts respectively report long stable world-model rollouts and real-policy correlation, improved real-policy ranking from real-to-sim reconstruction, and conditions for efficient mixed-fidelity estimation; these are separate evidence families but none independently replicates another's numeric result ([IWS official abstract](https://www.roboticsproceedings.org/rss22/p018.html); [PolaRiS official abstract](https://www.roboticsproceedings.org/rss22/p062.html); [Betting official abstract](https://www.roboticsproceedings.org/rss22/p090.html)). The peer-reviewed survey "World model for robot learning: A comprehensive survey" (Bohan Hou et al., *IJRR*, 28 September 2026) supplies independent synthesis, although only metadata/abstract were accessible ([DOI](https://doi.org/10.1177/02783649261488980)).
- **Unsolved.** Long-horizon physical consistency; contact and deformables; out-of-distribution evaluation; validity of correlation claims beyond the studied policies; cost.
- **Counterevidence.** The IWS abstract itself says prior world models are slow and physically inconsistent over long horizons; PolaRiS is motivated by unreliable prior simulation rankings. **[HYPE/DEMO]** The maker-authored preprint "Evaluating Gemini Robotics Policies in a Veo World Simulator" (Gemini Robotics Team, first posted 11 December 2025) is a self-evaluation of closed systems, not independent validation ([arXiv abstract](https://arxiv.org/abs/2512.10675)).
- **Maturity.** 2026 single-family results; correlation claims are about specific policy sets. High confidence that sim-to-real validity is an open measurement problem.
- **Competencies.** 3, 10, 11, 14, 17. **Entry experiment.** Train a small action-conditioned latent world model on a MuJoCo push task; measure rollout error versus horizon; rank three policies in the world model and in the simulator and compute rank correlation with intervals. **Constraints.** One GPU; no hardware.
- **Falsifiable question.** Does policy ranking inside a learned world model agree with real-robot ranking (Spearman ρ above a pre-set threshold) for policies not used to train the world model?

### F6. Continual learning, adaptation, uncertainty, runtime assurance, and safe learning

- **Evidence [FACT for records; UNCERTAIN for single-family abstract results].** "Towards Long-Lived Robots: Continual Learning VLA Models via Reinforcement Fine-Tuning" (Yuan Liu et al.), "EigenSafe: A Spectral Framework for Learning-Based Probabilistic Safety Assessment" (Inkyu Jang et al.), and "TAIL-Safe: Task-Agnostic Safety Monitoring for Imitation Learning Policies" (Riad Ahmed and Momotaz Begum) are final RSS XXII papers published 13 July 2026; the official abstracts report continual-learning gains, a probabilistic safety critic, and failure-derived imitation-policy monitoring respectively ([RFT abstract](https://www.roboticsproceedings.org/rss22/p086.html); [EigenSafe abstract](https://www.roboticsproceedings.org/rss22/p146.html); [TAIL-Safe abstract](https://www.roboticsproceedings.org/rss22/p207.html)). Independent peer-reviewed syntheses are "Safe Learning in Robotics: From Learning-Based Control to Safe Reinforcement Learning" (Lukas Brunke et al., *Annual Review*, 3 May 2022) and "Safe Control With Learned Certificates" (Charles Dawson, Sicun Gao, Chuchu Fan, *T-RO* 39(3), June 2023) ([review DOI](https://doi.org/10.1146/annurev-control-042920-020211); [certificate-survey DOI](https://doi.org/10.1109/TRO.2022.3232542)). The `safe-control-gym` paper and the verified `v1.0.0` artifact provide a practical benchmark family, not a safety certificate ([paper DOI](https://doi.org/10.1109/LRA.2022.3196132); [artifact boundary](https://github.com/learnsyslab/safe-control-gym/tree/dd1b293f3be1f3df56bb26cb66753e250afda00a)).
- **Unsolved.** Calibrated competence estimates for high-dimensional policies; forgetting in deployment; guarantees that survive perception error; fair benchmarks across control-theoretic and RL safety methods.
- **Counterevidence.** TAIL-Safe documents in-distribution failures; EigenSafe argues HJ reachability and CBFs give poorly calibrated probabilities under stochastic dynamics; the review notes the lack of shared benchmarks. The [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework) (voluntary, released 26 January 2023, under revision per the page) supplies risk questions, not technical guarantees.
- **Maturity.** Methods single-lab, 2026; reviews peer-reviewed; benchmark code-only. High confidence that runtime assurance is open.
- **Competencies.** 3, 4, 7, 12, 16, 17. **Entry experiment.** In the §11.5 `safe-control-gym` `v1.0.0` profile, first rerun the checkpoint and report its metrics and constraint metrics without treating the recorded values as an expected signature; add one safety filter only after its exact task, command, configuration, dependencies, and licence pass a separate preflight. Report reference RMSE, violation episodes/steps, intervention rate when applicable, and task cost under three prespecified disturbances. Do not infer safety from one successful rollout. **Constraints.** Simulation only; later hardware needs a safety case.
- **Falsifiable question.** Does a learned competence monitor halve real failures on an imitation-learned manipulation task at a false-stop rate below 10%, on identical trials?

### F7. Energy, latency, onboard compute, event and neuromorphic sensing, and hardware-software co-design

- **Evidence [FACT for final records; UNCERTAIN for author-reported abstract numbers].** "TinyVLA: Toward Fast, Data-Efficient Vision-Language-Action Models for Robotic Manipulation" (Junjie Wen et al., final RA-L 10(4), April 2025) targets fast inference without a separate pretraining stage ([DOI/abstract record](https://doi.org/10.1109/LRA.2025.3544909)). In official abstracts for final RSS XXII papers published 13 July 2026, Yufeng Liu et al.'s "Learning Native Continuation for Action Chunking Flow Policies" reports about 10% improvements in trajectory smoothness and completion time across five tasks ([official abstract](https://www.roboticsproceedings.org/rss22/p058.html)); Jindou Jia et al.'s "Action-to-Action Flow Matching" reports 0.56 ms single-step action generation ([official abstract](https://www.roboticsproceedings.org/rss22/p209.html)); and Gokul Puthumanaillam et al.'s "Muninn: Your Trajectory Diffusion Model But Faster" reports up to 4.6× wall-clock speedup while preserving its tested metrics ([official abstract](https://www.roboticsproceedings.org/rss22/p160.html)). These are three independent author families but not a shared-hardware benchmark. "Fully neuromorphic vision and control for autonomous drone flight" (F. Paredes-Vallés et al., *Science Robotics*, 15 May 2024) has an erratum dated 26 June 2024 whose text was inaccessible; its power/frequency numbers are therefore omitted rather than repeated ([paper DOI](https://doi.org/10.1126/scirobotics.adi0591); [erratum DOI](https://doi.org/10.1126/scirobotics.adr0223)).
- **Unsolved.** VLA-class models at control rates on embedded compute; energy accounting including sensing and actuation; neuromorphic systems beyond low-dimensional tasks; principled co-design.
- **Counterevidence.** The neuromorphic paper says such implementations have been limited to basic tasks; the latency claims are single-lab wall-clock numbers on single hardware; the 2026 critical review lists end-to-end latency among claims current benchmarks cannot establish.
- **Maturity.** Peer-reviewed single-family results; code-only or unknown. Medium-high confidence that onboard deployment of generalist policies is open.
- **Competencies.** 6, 11, 13, 15. **Entry experiment.** Profile a diffusion or flow policy on CPU and one GPU (steps, batch, chunk length versus latency); run it closed-loop in simulation with injected delays; plot success versus delay. **Constraints.** Embedded boards optional; power meters cheap.
- **Falsifiable question.** Does a one-step flow policy stay within 5 percentage points of its 10-step counterpart under a 20 ms action deadline on the same embedded device?

### F8. Aerial autonomy: GPS-denied navigation, wind and weather, active perception, multi-robot coordination, aerial manipulation, certifiable safety

- **Evidence [FACT for final records; quantitative values are author-reported at the named locator].** "Champion-level drone racing using deep reinforcement learning" (Elia Kaufmann et al., *Nature* 620, 30 August 2023) reports winning 5/9, 4/7, and 6/9 races against three champions; the locator is the paper's Results/Discussion HTML, not an abstract ([DOI/full record](https://doi.org/10.1038/s41586-023-06419-4)). "Learning high-speed flight in the wild" (Antonio Loquercio et al., *Science Robotics*, 13 October 2021) independently demonstrates sim-trained onboard flight in selected outdoor settings ([DOI record](https://doi.org/10.1126/scirobotics.abg5810)). Current lines include "Learning Agile Quadrotor Flight in the Real World" (Yunfan Ren et al., final RSS XXII, 13 July 2026; official abstract), "High-Speed Vision-Based Flight in Clutter With Safety-Shielded Reinforcement Learning" (Jiarui Zhang et al., final RA-L 11, August 2026; abstract record), and "D-Nav: End-to-End Dynamic UAV Navigation with Dual-Resolution Motion Awareness" (Liang Qin et al., final RSS XXII, 13 July 2026), whose official abstract reports simulated success rising from 0.37 to 0.56 plus separate real tests ([adaptation abstract](https://www.roboticsproceedings.org/rss22/p135.html); [safety-shield DOI](https://doi.org/10.1109/LRA.2026.3703580); [D-Nav official abstract](https://www.roboticsproceedings.org/rss22/p065.html)). Independent swarm lines include EGO-Swarm, RACER, and "Safe Multi-Agent Navigation via Constrained HJB-Informed Learning" ([EGO-Swarm DOI](https://doi.org/10.1109/ICRA48506.2021.9561902); [RACER DOI](https://doi.org/10.1109/TRO.2023.3236945); [Fenglan Wang et al., final RSS XXII official abstract, 13 July 2026](https://www.roboticsproceedings.org/rss22/p044.html)). Aerial manipulation remains represented by a peer-reviewed survey and separate construction/continuum/soft-grasp systems ([survey DOI](https://doi.org/10.1109/TRO.2021.3084395); [aerial construction DOI](https://doi.org/10.1038/s41586-022-04988-4); [continuum manipulator DOI](https://doi.org/10.1038/s41467-024-55157-2); [soft grasp DOI](https://doi.org/10.1038/s44182-024-00012-1)).
- **Unsolved.** Appearance, wind, rain, and degraded sensing; recovery after collision; agile flight without external infrastructure during training; certifiable perception; outdoor swarms without motion capture; aerial manipulation beyond prototypes.
- **Counterevidence [FACT for Swift's full-text limitations; UNCERTAIN for abstract-only generalization].** Swift's Results/Discussion attributes its losses 40% to opponent collisions, 40% to gate collisions, and 20% to being slower; it had no crash recovery, assumed training-like appearance, and used motion-capture poses to fit residual models. Loquercio et al. tested selected environments. D-Nav's own abstract leaves substantial failures, and the soft-grasp system's moving-target tests used motion capture. These boundaries, plus the independent 2024 drone-racing survey, block broad weather/recovery/certification claims ([survey DOI](https://doi.org/10.1109/TRO.2024.3400838)).
- **Maturity.** Strong peer-reviewed results with open hardware/software families; real-world results concentrate in a few groups. High confidence that weather-robust, recovery-capable, certifiable autonomy is open.
- **Competencies.** 1, 2, 4, 5, 7, 8, 9, 13, 16. **Entry experiment.** In PX4 SITL, implement a geometric controller with VIO in the loop; inject wind gusts and camera dropouts; measure tracking error, estimator divergence events, and failsafe triggers across seeds; add a CBF-style geofence filter and count violations. **Constraints.** All flight gated behind simulation, SITL/HIL, containment, supervision, and the legal checks in §13.
- **Falsifiable question.** Does a learned residual adaptation layer cut position RMSE under a 5 m/s simulated crosswind by at least 30% relative to the nominal controller without increasing geofence violations?

### F9. Humanoids and mobile manipulation

- **Evidence [FACT for final records; UNCERTAIN for authors' abstract-level outcomes].** "HumanoidBench: Simulated Humanoid Benchmark for Whole-Body Locomotion and Manipulation" (Carmelo Sferrazza et al., final RSS XX, July 2024) reports in its abstract that current RL struggles on most tasks and that a hierarchical baseline helps ([official DOI/abstract](https://doi.org/10.15607/RSS.2024.XX.061)). "Ψ0: An Open Foundation Model Towards Universal Humanoid Loco-Manipulation" (Songlin Wei et al., final RSS XXII, 13 July 2026) reports staged egocentric-video/robot-data training, but its promised open ecosystem was not verified ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p021.html)). "KinDER: A Physical Reasoning Benchmark for Robot Learning and Planning" (Yixuan Huang et al., final RSS XXII, 13 July 2026) reports real-to-sim-to-real mobile-manipulator tests and difficulty across its physical-reasoning suite ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p184.html)).
- **Unsolved.** Whole-body benchmarks on hardware; humanoid data; safety near people; whether humanoid morphology is worth its cost.
- **Counterevidence and [HYPE/DEMO].** Vendor humanoid reports are self-evaluated; the one third-party study of a closed vendor model found direct API fine-tuning short of deployment-level mastery before iterative closed-loop fine-tuning (["CLIFT: Turning Gemini Robotics On-Device into Humanoid Specialists via Non-Invasive Closed-Loop Iterative Fine-Tuning", Yuxin Chen et al., arXiv preprint, 31 July 2026](https://arxiv.org/abs/2607.29172)). No independent replication of any vendor humanoid headline claim was found.
- **Maturity.** Simulation benchmarks open; real-world generalist humanoid results vendor or single-lab. High confidence that general humanoid loco-manipulation is unsolved.
- **Competencies.** 1, 2, 4, 5, 7, 8, 12, 15, 16. **Entry experiment.** Reproduce one HumanoidBench task with a hierarchical baseline; ablate low-level skill quality; report learning curves across seeds. **Constraints.** Humanoid hardware is out of individual scope.
- **Falsifiable question.** On fixed whole-body tasks, does a policy pretrained on egocentric video and post-trained on 30 h of robot data outperform one trained on 300 h of cross-embodiment data, when a third party evaluates both?

### F10. Human-robot interaction and human-centered safety

- **Evidence [FACT for final records; UNCERTAIN for single-family abstract results].** "Social Human Robot Embodied Conversation (SHREC) Dataset: Benchmarking Foundational Models' Social Reasoning" (Dong Won Lee et al., final RSS XXII, 13 July 2026) reports 400 real interaction videos, more than 10,000 annotations, eight tasks, and gaps versus humans in the official abstract ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p113.html); [official repository](https://github.com/mitmedialab/SHREC); [manually gated Hugging Face wellness-home subset](https://huggingface.co/datasets/MIT-personal-robots/shrec_wellness_home)). "Beyond Failure Recovery: An Engagement-Aware Human-in-the-loop Framework for Robotic Systems" (Jiaying Fang et al., final RSS XXII, 13 July 2026) evaluates engagement-aware MPC in simulation and a real bite-acquisition study with emulated mobility limitations ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p118.html)). "Knowing When Not to Help: Active Estimation of Human Reachability for Just-Right Robot Assistance" (Ziang Liu et al., final RSS XXII, 13 July 2026) reports approximately 0.50 reachability IoU within 20 queries in its **truncated official abstract**; full result context was not audited, so the number must not drive a design decision ([official proceedings abstract](https://www.roboticsproceedings.org/rss22/p119.html)).
- **Unsolved.** Transfer from emulated-impairment lab studies to real users; social-error detection; long-term trust; safety standards for learned behavior near people (ISO pages inaccessible).
- **Counterevidence.** SHREC's own result; small, partly emulated study populations.
- **Maturity.** Manually gated data; licence not established at cutoff (the repository states licence pending); methods single-lab; small-N studies. Medium-high confidence.
- **Competencies.** 3, 7, 16, 17, 18, 19. **Entry experiment.** Only after access is granted, the approved terms permit the work, and applicable data-use and ethics requirements are met, replicate SHREC's social-error detection with an open VLM; report precision and recall per category; draft the ethics protocol a follow-up user study would need. **Constraints.** Human studies need ethics approval; do not redistribute source or derived artifacts unless the final licence permits it.
- **Falsifiable question.** Does a robot that adapts interaction frequency to measured engagement reduce reported workload without lowering task success in a pre-registered within-subject study with real users?

### F11. Benchmark and evaluation science: do offline scores predict deployment?

- **Evidence [FACT for publication identity; results remain scoped to each paper].** "Deep Reinforcement Learning That Matters" (Peter Henderson et al., AAAI 2018) documents seed, hyperparameter, and implementation sensitivity ([DOI](https://doi.org/10.1609/aaai.v32i1.11694)). Independent final RSS XXII papers published 13 July 2026 approach validity from different directions: "PolaRiS" tests simulator-to-real policy ranking, "Betting for Sim-to-Real Performance Evaluation" formalizes mixed-fidelity estimation, "LIBERO-X" tests compounded VLA shifts, "KinDER" tests physical reasoning, and "OopsieVerse: A Safety Benchmark with Damage-Aware Simulation for Robot Manipulation" separates damage from task success ([PolaRiS abstract](https://www.roboticsproceedings.org/rss22/p062.html); [Betting abstract](https://www.roboticsproceedings.org/rss22/p090.html); [LIBERO-X abstract](https://www.roboticsproceedings.org/rss22/p097.html); [KinDER abstract](https://www.roboticsproceedings.org/rss22/p184.html); [OopsieVerse abstract](https://www.roboticsproceedings.org/rss22/p098.html)). FurnitureBench and EgoVerse add reproducibility and multi-lab evidence from separate families.
- **Unsolved.** Standard reporting of trials, seeds, and intervals; closed-loop versus offline metrics; damage and safety metrics; third-party evaluation.
- **Counterevidence.** The field's benchmark papers report headline numbers on the same benchmarks the 2026 review and LIBERO-X judge insufficient; present any such number with that caveat.
- **Maturity.** Active 2026 research line; practices not standardized. High confidence that evaluation validity is open.
- **Competencies.** 3, 14, 17, 18. **Entry experiment.** Take any published simulation result with released code; rerun with ten seeds; report the interval; change one nuisance factor (camera pose, lighting) and report again; publish the memo. **Constraints.** Compute only.
- **Falsifiable question.** Across N released policies, is the Spearman correlation between a standard simulation score and real success below 0.5, and does a real-to-sim benchmark raise it above 0.8 on the same policies?

### F12. Autonomous scientific robotics: can a physical system produce new science?

- **Evidence [FACT].** A mobile robot ran a chemistry laboratory autonomously to search a photocatalyst space ([Burger et al., *Nature* 583, 8 July 2020](https://doi.org/10.1038/s41586-020-2442-2)). A-Lab reported autonomous synthesis of computationally proposed inorganic materials ([Szymanski et al., *Nature* 624, 29 November 2023](https://doi.org/10.1038/s41586-023-06734-w)) alongside a large-scale materials-prediction paper ([Merchant et al., *Nature* 624](https://doi.org/10.1038/s41586-023-06735-9)). Coscientist planned and ran reaction optimization with a large language model ([Boiko et al., *Nature* 624, 20 December 2023](https://doi.org/10.1038/s41586-023-06792-0)). A review documents self-driving labs ([Abolhasani and Kumacheva, *Nature Synthesis*, 2023](https://doi.org/10.1038/s44160-022-00231-0)).
- **Unsolved.** Whether autonomy generates hypotheses humans would not; how to credit discovery; cross-lab reproducibility of robot-executed chemistry; extension beyond materials and chemistry.
- **Counterevidence [UNCERTAIN].** The abstracts read describe closed-loop optimization or synthesis of computationally proposed candidates; none claims a law or mechanism discovered by the robot. Published comments or reanalyses of the A-Lab and materials-prediction papers were not checked in this pass, so no "new materials discovered" wording is adopted here.
- **Maturity.** Peer-reviewed, institution-scale; cross-lab replication unknown. Medium confidence that "autonomous robots produce new science" is unproven.
- **Competencies.** 3, 9, 11, 13, 17, 18, 19. **Entry experiment.** Build a simulated closed-loop Bayesian-optimization "lab" over a known response surface; compare active learning against random and grid sampling; add noise and failed-run models; report discovery efficiency. **Constraints.** Wet-lab work needs institutional access and chemical-safety training.
- **Falsifiable question.** Given identical starting hypotheses and budgets, does an autonomous loop reach a pre-registered discovery criterion in fewer experiments than a human-run loop, judged by a blinded panel?

---

## 7. Seminal-to-frontier reading map

### 7.1 How to read

Four passes per paper: (1) claim and assumption map; (2) derivation and architecture; (3) evidence and failure audit (splits, seeds, closed-loop versus offline, artifacts, compute); (4) implementation or a falsifying test. "Full" includes appendices and artifact documentation. Hours are reading-and-notes estimates; reproduction time is extra. Final proceedings control bibliographic identity where arXiv bylines differ (noted below).

Do not read all 36 items in order. The binding workload is the extract/depth table below: **32 hours of common papers plus one 24-hour branch**. The remaining entries are course extracts or references.

- **Common papers:** RL-10, RL-15, RL-18, RL-19, RL-23, RL-25 (reading/artifact audit only), RL-31.
- **Track A branch:** RL-24, RL-28, RL-29, RL-32, RL-33.
- **Track B branch:** RL-12, RL-13, RL-34, RL-35, RL-36.
- **Track C branch:** RL-3, RL-11, RL-14, RL-20, RL-21.
- **Reference/on demand:** every other item; add one only by removing equal paper hours.

Prerequisite codes: **M** linear algebra/calculus/ODEs; **P** probability; **O** optimization; **D** dynamics and control; **V** camera geometry; **ML** deep learning in PyTorch; **RL** sequential decision making; **S** Linux/Python/C++ and versioned experiments.

### 7.2 Selective extract and depth contract for all 36 retained items

Codes: **C** = mandatory common paper spine; **A/B/Ct** = mandatory only for Track A/B/C; **F** = selected chapters charged to the §8 foundation/course budget, not paper hours; **R** = reference/on demand. `Deep` means claim, method, evidence, limitations, and artifact notes; `derive` adds the key equations/proof; `reproduce` adds an executable result. Do not turn an R item into required work without removing equal hours elsewhere.

| ID | Status; hours | Required extract | Depth / output |
|---|---:|---|---|
| RL-1 | F | Chs. 2–6, 8–11; ch. 13 only when the mobile base is active | Derive selected transforms/Jacobians; implement inside Rungs 1/3 |
| RL-2 | R | Recursive Bayes filter, particle filter, localization and SLAM chapters | Skim/consult for an estimator failure |
| RL-3 | Ct, 6 h; otherwise F/R | Probability recap; batch least squares; Lie-group state; robust loss; one visual–inertial example | Deep/derive; one Jacobian check |
| RL-4 | F/R | Configuration space, graph search, sampling-based and kinodynamic planning chapters | Derive only definitions/guarantees used in Rung 3 |
| RL-5 | F | Feedback, stability, sensitivity, state feedback, observers, robustness chapters | Deep/derive; map assumptions to Rung 1 |
| RL-6 | F/R | Camera model/calibration, matching, multi-view geometry, motion/depth evaluation | Deep only when the active project uses vision |
| RL-7 | F/R | Chs. 3–6 and 9–13 | Work exercises needed for M8; not a separate cover-to-cover task |
| RL-8 | R | Friction cone, wrench space, planar pushing/contact-mode chapters | Derive on demand for Track A |
| RL-9 | F/R | Vehicle model, estimator, autopilot, path-following chapters | Deep for fixed-wing work; otherwise reference |
| RL-10 | **C, 2 h** | Whole paper; extract situated-agent claim and the subsumption layers | Critical skim; map a current stack and name where explicit state is necessary |
| RL-11 | **Ct, 6 h** | Factorization, elimination, sparse least squares, smoothing/filtering, incremental inference | Deep/derive; build a tiny pose graph |
| RL-12 | **B, 5 h** | System diagram, visual–inertial initialization, atlas/loop closure, EuRoC evaluation, repository build notes | Deep + artifact audit; do not claim deployment readiness |
| RL-13 | **B, 5 h** | Preintegration, sliding window, marginalization, initialization/calibration, failure recovery, README | Deep + artifact audit; identify ROS 1 dependencies |
| RL-14 | **Ct, 2 h** | Taxonomy, trajectory representations, asynchronous-measurement comparison | Structured skim; classify two estimators |
| RL-15 | **C, 5 h** | Problem definitions; completeness/optimality statements; finite-sample experiments | Derive main claim; reproduce cost-vs-samples plot in Rung 3 |
| RL-16 | R | Objective, smoothness metric, obstacle functional, initialization experiments | Deep on demand for trajectory optimization |
| RL-17 | R | Conditioning/adaptation method, baselines, collision checking, limits | Critical skim; artifact status unknown |
| RL-18 | **C, 5 h** | SE(3) errors, controller, stability proposition, simulation assumptions | Derive and implement in Rung 1/4 |
| RL-19 | **C, 6 h** | CBF/CLF definitions, forward invariance, relative degree, QP, feasibility assumptions | Derive and test model mismatch |
| RL-20 | **Ct, 5 h** | Predictive filter architecture, recursive-feasibility assumptions, experiments | Deep/derive; list every unverified real-system assumption |
| RL-21 | **Ct, 5 h** | Guarantee taxonomy, uncertainty/safe-RL sections, benchmark recommendations | Deep survey map; trace two claims to primary papers |
| RL-22 | R | Model-based/model-free paths, synthetic data, metrics, limitations, licence/README | Artifact audit only when 6-D pose is active |
| RL-23 | **C, 3 h** | Distribution-shift argument, no-regret reduction, DAgger algorithm and assumptions | Deep; reproduce BC-vs-DAgger mechanism only if chosen |
| RL-24 | **A, 3 h** | Randomization distribution, transfer setup, held-out real test and limits | Deep; predeclare range sweep |
| RL-25 | **C, 6 h reading only** | Denoising/action-horizon mechanism; Push-T results; limitations; immutable README training/evaluation commands; `conda_environment.yaml`; PyMunk environment | Deep artifact audit. A faithful run is optional Track A and uses §11.5, not common hours |
| RL-26 | R | ACT/action chunking, temporal ensembling, data collection, simulated-task instructions | Deep only if bimanual imitation is selected |
| RL-27 | R | Input embedding, data mixture, transfer ablations, closed-artifact limits | Critical skim; separate language/perception/planning/control claims |
| RL-28 | **A, 7 h** | Action tokenization, OXE mixture, 29-task evaluation, LoRA instructions, memory/licence notes | Deep + checkpoint/inference audit; no full pretraining claim |
| RL-29 | **A, 7 h** | Flow-matching head, action normalization, data mixture, closed-loop evaluation, openpi limits | Deep + supported-checkpoint audit |
| RL-30 | R, hype watch | Open-world definition, data split, knowledge insulation, limits, checkpoint README | Critical skim; preprint only at cutoff |
| RL-31 | **C, 5 h** | Perturbation hierarchy, cumulative protocol, metrics, degradation results, artifact-status check | Deep benchmark critique; recreate one perturbation only in Track A/C |
| RL-32 | **A, 3 h** | Whole Part I: impedance objective, environment interaction, passivity intuition | Derive; simulate uncertain stiffness |
| RL-33 | **A, 4 h** | Randomization table, recurrent policy, hardware protocol, resets, compute, limitations | Systems audit; no faithful reproduction claim |
| RL-34 | **B, 4 h** | Polynomial parameterization, continuity constraints, snap objective, tracking setup | Derive; reproduce a waypoint trajectory on CPU |
| RL-35 | **B, 5 h** | Direct time-optimal formulation, actuator limits, numerical method, example-repository scope | Deep + run example when dependencies pass |
| RL-36 | **B, 5 h** | Main paper, methods/extended data, race protocol, latency, loss causes, code-availability statement | Critical system audit; simulation only |

**Unique reading-hour accounting:** every learner completes the 32-hour C spine plus exactly one 24-hour track branch, totaling **56 mandatory paper hours**. In the 10 h plan, P = 116 h = 56 mandatory reading + 60 technical monitoring/triage. In the 20 h plan, P = 218 h = 56 mandatory + 102 second-branch/frontier depth + 60 technical monitoring/triage. Book/course extracts marked F are already inside the 160/250 foundation totals in §15.4.

### 7.3 Foundation shelf (books)

The hours below estimate broad/full use for comparison. The binding 24-month extracts and charged category are in §7.2 and §8; do not add these hours again.

| ID | Exact identity and links | Status; read mode; hours; prerequisites | Why it matters; reproduction or critique task |
|---|---|---|---|
| RL-1 | *Modern Robotics: Mechanics, Planning, and Control*, Kevin M. Lynch and Frank C. Park, Cambridge University Press, 2017; [DOI](https://doi.org/10.1017/9781316661239); [official companion materials](https://modernrobotics.northwestern.edu/nu-gm-book-resource/) | Foundational; rigid motion, kinematics, Jacobians, dynamics, trajectories, planning, control in full; 80–120 h; M, programming | One consistent SE(3) and screw-theory vocabulary. Task: implement forward kinematics, a numerical Jacobian check, inverse dynamics, and one feedback controller. |
| RL-2 | *Probabilistic Robotics*, Sebastian Thrun, Wolfram Burgard, Dieter Fox, MIT Press, 2005; [MIT Press record](https://mitpress.mit.edu/9780262201629/probabilistic-robotics/) | **[STALE-BUT-FOUNDATIONAL]**; Bayes filters, Gaussian and particle filters, localization, mapping, SLAM selectively; 40–60 h; P, M. Library or purchase (no verified legal free text). | Canonical probabilistic decomposition of localization and mapping. Task: compare EKF and particle filter under non-Gaussian outliers. |
| RL-3 | *State Estimation for Robotics*, second edition, Timothy D. Barfoot, Cambridge University Press, online 11 January 2024; [DOI](https://doi.org/10.1017/9781009299909); [author copy](https://asrl.utias.utoronto.ca/~tdb/bib/barfoot_ser24.pdf) | Current core; substantially full; 80–110 h; M, P, O | Bridge from Kalman filtering to batch nonlinear least squares on manifolds with robust losses. Task: derive and implement one SE(3) batch estimator; verify Jacobians by finite differences; add a robust loss. |
| RL-4 | *Planning Algorithms*, Steven M. LaValle, Cambridge University Press, 2006; [DOI](https://doi.org/10.1017/CBO9780511546877); [author-hosted text](https://lavalle.pl/planning/) | **[STALE-BUT-FOUNDATIONAL]**; configuration spaces, search, sampling, uncertainty, kinodynamic planning selectively; 45–70 h; M, algorithms | Exact distinctions among completeness, optimality, information state, and feasibility. Task: implement PRM and RRT on the same space; report failure versus sample budget. |
| RL-5 | *Feedback Systems: An Introduction for Scientists and Engineers*, Karl J. Åström and Richard M. Murray, Princeton University Press, 2008; [DOI](https://doi.org/10.1515/9781400828739); [author electronic copy](https://www.cds.caltech.edu/~murray/books/AM08/pdf/fbs-public_24Jul2020.pdf) | **[STALE-BUT-FOUNDATIONAL]** in examples only; feedback, stability, loop shaping, state feedback, observers, robustness in full; 45–65 h; M | Sensitivity, margins, and why a controller is judged as part of a closed loop. Task: design and stress a controller under plant mismatch and sensor delay. |
| RL-6 | *Computer Vision: Algorithms and Applications*, second edition, Richard Szeliski, Springer, 2022; [DOI](https://doi.org/10.1007/978-3-030-34372-9); [author page with legal personal-use PDF](https://szeliski.org/Book/) | Current foundation; camera models, features, multi-view geometry, motion, depth, recognition selectively; 50–80 h; M, P | Geometric and statistical assumptions behind visual measurements. Task: calibrate a camera; propagate pixel error into pose uncertainty; evaluate features under blur and illumination shift. |
| RL-7 | *Reinforcement Learning: An Introduction*, second edition, Richard S. Sutton and Andrew G. Barto, MIT Press, 2018; [author page and PDF](http://incompleteideas.net/book/the-book-2nd.html) | Foundational; Parts I–II closely; 70–100 h; P, M | Bellman equations, MC/TD, function approximation, on/off-policy. Task: reproduce tabular and approximation examples before any robot RL. |
| RL-8 | *Mechanics of Robotic Manipulation*, Matthew T. Mason, MIT Press, 2001; [DOI](https://doi.org/10.7551/mitpress/4527.001.0001) | **[STALE-BUT-FOUNDATIONAL]**; contact kinematics, friction, grasping, pushing selectively; 35–50 h; M, mechanics; library access (landing page 403) | Friction cones, wrench spaces, contact modes that learned policies must obey. Task: derive feasible wrenches for a planar push; compare with simulation. |
| RL-9 | *Small Unmanned Aircraft: Theory and Practice*, Randal W. Beard and Timothy W. McLain, Princeton University Press, 2012; [DOI](https://doi.org/10.1515/9781400840601); [companion simulation code](https://github.com/byu-magicc/mavsim_public) | **[STALE-BUT-FOUNDATIONAL]** for tooling; aircraft models, estimation, autopilot, path following selectively; 45–70 h; M, P, D | Full estimation-guidance-control stack derived from a vehicle model. Task: reproduce one path-following example; inject wind, bias, delay, saturation. Fixed-wing emphasis; use RL-18, RL-34, RL-35 for quadrotors. |

### 7.4 Framing, estimation, planning, control, safety, perception

| ID | Exact identity and links | Status; hours; prerequisites | Why; task |
|---|---|---|---|
| RL-10 | "Intelligence without representation", Rodney A. Brooks, *Artificial Intelligence* 47(1–3), 1991; [DOI](https://doi.org/10.1016/0004-3702(91)90053-M); [author PDF](https://people.csail.mit.edu/brooks/papers/representation.pdf) | **[STALE-BUT-FOUNDATIONAL]**; 3 h; none | Situated behavior and layered control. Task: map a modern stack onto the layers; identify where explicit estimation or planning is indispensable. |
| RL-11 | *Factor Graphs for Robot Perception*, Frank Dellaert and Michael Kaess, *Foundations and Trends in Robotics* 6(1–2), 2017; [DOI](https://doi.org/10.1561/2300000043); [author PDF](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf); [GTSAM](https://gtsam.org/) | Survey/tutorial; 16–24 h; M, P, O | Factorization, elimination, Bayes trees, smoothing versus filtering. Task: build a small pose graph; compare batch and incremental updates. |
| RL-12 | "ORB-SLAM3: An Accurate Open-Source Library for Visual, Visual–Inertial, and Multimap SLAM", Carlos Campos, Richard Elvira, Juan J. Gómez Rodríguez, José M. M. Montiel, Juan D. Tardós, *IEEE T-RO* 37(6), December 2021; [DOI](https://doi.org/10.1109/TRO.2021.3075644); [arXiv](https://arxiv.org/abs/2007.11898); [code](https://github.com/UZ-SLAMLab/ORB_SLAM3) | Primary open baseline; 8 h; P, O, V, S; code and public data (GPL-3.0) | Multimap atlas, VI initialization, loop closure, evaluation across sensor configurations. Task: run a EuRoC sequence; report error and runtime; perturb camera–IMU calibration and timing. |
| RL-13 | "VINS-Mono: A Robust and Versatile Monocular Visual-Inertial State Estimator", Tong Qin, Peiliang Li, Shaojie Shen, *IEEE T-RO* 34(4), August 2018; [DOI](https://doi.org/10.1109/TRO.2018.2853729); [arXiv](https://arxiv.org/abs/1708.03852); [code](https://github.com/HKUST-Aerial-Robotics/VINS-Mono) | **[STALE-BUT-FOUNDATIONAL]** ROS 1-era implementation; 8–10 h; P, O, V, S | IMU preintegration, sliding window, marginalization, initialization, recovery. Task: run EuRoC; log latency and drift; break initialization and calibration deliberately. |
| RL-14 | "Continuous-Time State Estimation Methods in Robotics: A Survey", William Talbot, Julian Nubert, Turcan Tuna, Cesar Cadena, Frederike Dümbgen, Jesús Tordesillas, Timothy D. Barfoot, Marco Hutter, *IEEE T-RO* 41, 2025; [DOI](https://doi.org/10.1109/TRO.2025.3593079); [arXiv](https://arxiv.org/abs/2411.03951) | Survey; 8 h; RL-3, O, Lie groups | When asynchronous high-rate sensors make discrete states awkward; splines versus Gaussian processes. Task: classify two estimators by their smoothness assumptions. |
| RL-15 | "Sampling-based algorithms for optimal motion planning", Sertac Karaman and Emilio Frazzoli, *IJRR* 30(7), June 2011; [DOI](https://doi.org/10.1177/0278364911406761); [arXiv](https://arxiv.org/abs/1105.1186) | **[STALE-BUT-FOUNDATIONAL]**; 10–12 h; algorithms, P, mathematical maturity | Feasibility versus asymptotic optimality; why RRT*/PRM* change connection policy. Task: plot cost and failure rate versus samples for RRT and RRT* in narrow-passage and open scenes. |
| RL-16 | "CHOMP: Gradient optimization techniques for efficient motion planning", Nathan Ratliff, Matt Zucker, J. Andrew Bagnell, Siddhartha Srinivasa, ICRA 2009; [DOI](https://doi.org/10.1109/ROBOT.2009.5152817); [CMU record](https://www.ri.cmu.edu/publications/chomp-gradient-optimization-techniques-for-efficient-motion-planning/) | **[STALE-BUT-FOUNDATIONAL]**; 4 h; O, kinematics | Trajectory-space objectives and functional gradients. Task: implement a 2-D trajectory optimizer; vary initialization; report local minima. |
| RL-17 | "Motion Planning Diffusion: Learning and Adapting Robot Motion Planning With Diffusion Models", João Carvalho, An Thai Le, Piotr Kicki, Dorothea Koert, Jan Peters, *IEEE T-RO* 41, 2025; [DOI](https://doi.org/10.1109/TRO.2025.3593109); [arXiv](https://arxiv.org/abs/2412.19948) | Primary frontier; 8 h; O, ML, planning; artifact status unknown | Learned trajectory distributions as planning priors; where collision checking remains. Task: compare against sampling and trajectory-optimization baselines under identical scenes and wall-clock. |
| RL-18 | "Geometric tracking control of a quadrotor UAV on SE(3)", Taeyoung Lee, Melvin Leok, N. Harris McClamroch, IEEE CDC 2010; [DOI](https://doi.org/10.1109/CDC.2010.5717652) | **[STALE-BUT-FOUNDATIONAL]**; 5–6 h; M, D, SO(3)/SE(3) | Coordinate-free attitude error and tracking without Euler singularities. Task: implement; test large attitude errors and saturation; separate convergence from motor feasibility. |
| RL-19 | "Control Barrier Function Based Quadratic Programs for Safety Critical Systems", Aaron D. Ames, Xiangru Xu, Jessy W. Grizzle, Paulo Tabuada, *IEEE TAC* 62(8), August 2017; [DOI](https://doi.org/10.1109/TAC.2016.2638961); [arXiv](https://arxiv.org/abs/1609.06408) | Foundational safety; 8–10 h; D, O, nonlinear systems | Forward invariance, relative degree, CLF–CBF QPs, feasibility. Task: build a double-integrator safety filter; add disturbance and model error; count violations and infeasible QPs. |
| RL-20 | "A predictive safety filter for learning-based control of constrained nonlinear dynamical systems", Kim Peter Wabersich and Melanie N. Zeilinger, *Automatica* 129, July 2021; [DOI](https://doi.org/10.1016/j.automatica.2021.109597); [arXiv](https://arxiv.org/abs/1812.05506) | MPC-to-learning bridge; 7–9 h; D, O, MPC; artifacts unknown | Receding-horizon intervention and recursive feasibility. Task: compare intervention frequency and performance under calibrated versus miscalibrated uncertainty. |
| RL-21 | "Safe Learning in Robotics: From Learning-Based Control to Safe Reinforcement Learning", Lukas Brunke, Melissa Greeff, Adam W. Hall, Zhaocong Yuan, Siqi Zhou, Jacopo Panerati, Angela P. Schoellig, *Annual Review of Control, Robotics, and Autonomous Systems* 5, 2022; [DOI](https://doi.org/10.1146/annurev-control-042920-020211); [arXiv](https://arxiv.org/abs/2108.06266) | Survey; 7–8 h; D, P, RL | Map from model-based safety to constrained RL and the type of guarantee each offers. Task: classify five papers by guarantee type, phase, assumptions, evidence. |
| RL-22 | "FoundationPose: Unified 6D Pose Estimation and Tracking of Novel Objects", Bowen Wen, Wei Yang, Jan Kautz, Stan Birchfield, CVPR 2024; [DOI](https://doi.org/10.1109/CVPR52733.2024.01692); [arXiv](https://arxiv.org/abs/2312.08344); [project](https://nvlabs.github.io/FoundationPose/); [code](https://github.com/NVlabs/FoundationPose) | Primary frontier; 6–8 h; V, ML, 3-D geometry; code and weights available but a diffusion-augmented data subset and weights were withheld, under an NVIDIA source-code licence | Model-based versus model-free pathways and synthetic training. Task: run the demo and one public evaluation; test occlusion, reflections, bad masks, mesh error. |

### 7.5 Robot learning, generalist policies, manipulation, aerial autonomy

| ID | Exact identity and links | Status; hours; prerequisites; artifacts | Why; task |
|---|---|---|---|
| RL-23 | "A Reduction of Imitation Learning and Structured Prediction to No-Regret Online Learning", Stephane Ross, Geoffrey Gordon, Drew Bagnell (final PMLR byline), AISTATS 2011, PMLR 15; [PMLR record](https://proceedings.mlr.press/v15/ross11a.html); [arXiv](https://arxiv.org/abs/1011.0686) | **[STALE-BUT-FOUNDATIONAL]**; 4 h; supervised learning | Learner-induced distribution shift and DAgger. Task: compare BC and DAgger on a toy control task reporting expert queries and off-trajectory recovery. |
| RL-24 | "Domain randomization for transferring deep neural networks from simulation to the real world", Josh Tobin, Rachel Fong, Alex Ray, Jonas Schneider, Wojciech Zaremba, Pieter Abbeel, IROS 2017; [DOI](https://doi.org/10.1109/IROS.2017.8202133); [arXiv](https://arxiv.org/abs/1703.06907) | **[STALE-BUT-FOUNDATIONAL]**; 4 h; ML; original artifacts not found | The randomization distribution as a modeling decision. Task: sweep ranges and test held-out shifts rather than one deployment. |
| RL-25 | "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion", Cheng Chi, Siyuan Feng, Yilun Du, Zhenjia Xu, Eric Cousineau, Benjamin CM Burchfiel, Shuran Song (final RSS byline), RSS XIX, 10 July 2023; [DOI](https://doi.org/10.15607/RSS.2023.XIX.026); [proceedings](https://www.roboticsproceedings.org/rss19/p026.html); [project](https://diffusion-policy.cs.columbia.edu/); [immutable code snapshot](https://github.com/real-stanford/diffusion_policy/tree/5ba07ac6661db573af695b419a7947ecb704690f) | Primary; 6 h common reading; ML, imitation, diffusion; code/data/checkpoints/logs available | Extract denoising, receding-horizon execution, horizons, latency, and exact artifact assumptions. **Do not reproduce in the common path.** Optional Track A: image-conditioned Push-T training in the author PyMunk/CUDA environment. The README's low-dimensional checkpoint example is a different task and still specifies `cuda:0`; any CPU run or MuJoCo port is an adaptation. |
| RL-26 | "Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware", Tony Z. Zhao, Vikash Kumar, Sergey Levine, Chelsea Finn, RSS XIX, 10 July 2023; [DOI](https://doi.org/10.15607/RSS.2023.XIX.016); [ALOHA project](https://tonyzhaozh.github.io/aloha/); [ACT code](https://github.com/tonyzhaozh/act) | Primary; 7–8 h; ML, imitation, kinematics; code and simulated data | Action chunking with a conditional VAE, temporal ensembling, teleoperation design. Task: reproduce simulated tasks; compare ACT with one-step BC on identical demonstrations. "Low-cost" is relative to research arms. |
| RL-27 | "PaLM-E: An Embodied Multimodal Language Model", Danny Driess et al. (22 authors), ICML 2023, PMLR 202; [PMLR record](https://proceedings.mlr.press/v202/driess23a.html); [arXiv](https://arxiv.org/abs/2303.03378); [project](https://palm-e.github.io/) | Primary bridge; 6 h selective; transformers, multimodal; closed artifacts | How continuous sensor inputs enter a language-model sequence. Task: draw the data and inference path; label which abilities are perception, language, planning, or closed-loop control. |
| RL-28 | "OpenVLA: An Open-Source Vision-Language-Action Model", Moo Jin Kim et al. (17 authors, final PMLR byline), CoRL 2024, PMLR 270, published 12 January 2025; [PMLR record](https://proceedings.mlr.press/v270/kim25c.html); [arXiv](https://arxiv.org/abs/2406.09246); [project](https://openvla.github.io/); [code](https://github.com/openvla/openvla) | Primary frontier; 9–10 h; ML, VLMs, imitation; code, weights, public data mixture; repository reported about 27 GB GPU memory for LoRA and about 72 GB for full fine-tuning | Action tokenization, Open X-Embodiment mixture, fine-tuning. Task: run inference or LoRA fine-tuning on a public benchmark; compare latency and closed-loop success with a smaller policy. |
| RL-29 | "π₀: A Vision-Language-Action Flow Model for General Robot Control", Kevin Black et al. (25 authors, final RSS byline), RSS XXI, 21 June 2025; [DOI](https://doi.org/10.15607/RSS.2025.XXI.010); [proceedings](https://www.roboticsproceedings.org/rss21/p010.html); [arXiv](https://arxiv.org/abs/2410.24164); [openpi code](https://github.com/Physical-Intelligence/openpi) | Primary frontier; 9–10 h; ML, flow matching; code and checkpoints; pretraining data largely private; repository reported >8 GB inference, >22.5 GB LoRA, >70 GB full fine-tuning | Flow-matching action head, cross-embodiment normalization, evaluation boundaries. Task: compare a released checkpoint with RL-28 under one protocol for success, recovery, latency. |
| RL-30 | "π₀.₅: a Vision-Language-Action Model with Open-World Generalization", Physical Intelligence (36 listed authors), arXiv, 22 April 2025; [arXiv](https://arxiv.org/abs/2504.16054); [project](https://www.pi.website/blog/pi05); [openpi](https://github.com/Physical-Intelligence/openpi) | **[HYPE/DEMO]-adjacent preprint**; 6–7 h; RL-29; no final peer-reviewed record found in targeted Crossref and RSS XXII checks | A concrete "open-world" generalization proposal with released checkpoints. Task: enumerate every axis called open-world; separate in-distribution composition from novelty; test a checkpoint on predeclared shifts. |
| RL-31 | "LIBERO-X: Robustness Litmus for Vision-Language-Action Models", Guodong Wang, Chenkai Zhang, Qingjie Liu, Jinjin Zhang, Jiancheng Cai, Junjie Liu, Xinmin Liu, RSS XXII, July 2026; [DOI](https://doi.org/10.15607/RSS.2026.XXII.097); [proceedings](https://www.roboticsproceedings.org/rss22/p097.html) | Primary benchmark/counterevidence; 5 h; imitation, evaluation; artifacts unknown; not independently replicated | Hierarchical perturbation protocol and compounded-shift degradation. Task: recreate one perturbation family for an open policy; report intervals, failure classes, recovery behavior. |
| RL-32 | "Impedance Control: An Approach to Manipulation: Part I—Theory", Neville Hogan, *Journal of Dynamic Systems, Measurement, and Control* 107(1), 1 March 1985; [DOI](https://doi.org/10.1115/1.3140702) | **[STALE-BUT-FOUNDATIONAL]**; 4 h; D; ASME page metadata/paywall | Regulating the motion–force relationship rather than position. Task: simulate contact against uncertain stiffness; compare stiff position control with impedance control. |
| RL-33 | "Learning dexterous in-hand manipulation", OpenAI (Marcin Andrychowicz et al., 16 authors), *IJRR* 39(1), online 18 November 2019; [DOI](https://doi.org/10.1177/0278364919887447); [arXiv](https://arxiv.org/abs/1808.00177) | **[STALE-BUT-FOUNDATIONAL]** system study; 7–8 h; RL, ML, D; closed artifacts | Scale of randomization, memory under contact, hidden systems work. Task: audit the randomized variables, privileged signals, resets, compute, and unreported dependencies. |
| RL-34 | "Minimum snap trajectory generation and control for quadrotors", Daniel Mellinger and Vijay Kumar, ICRA 2011; [DOI](https://doi.org/10.1109/ICRA.2011.5980409) | **[STALE-BUT-FOUNDATIONAL]**; 5–6 h; M, O, D, differential flatness | Polynomial trajectories and separation of generation from tracking. Task: generate a waypoint trajectory; check derivative continuity and motor-feasibility proxies; add wind and saturation to the tracker. |
| RL-35 | "Time-optimal planning for quadrotor waypoint flight", Philipp Foehn, Angel Romero, Davide Scaramuzza, *Science Robotics* 6(56), 21 July 2021; [DOI](https://doi.org/10.1126/scirobotics.abh1221); [author PDF](https://rpg.ifi.uzh.ch/docs/ScienceRobotics21_Foehn.pdf); [example code](https://github.com/uzh-rpg/rpg_time_optimal) | Primary; 7–8 h; O, D; code only (example implementation) | Direct time-optimal formulation versus minimum-snap smoothness. Task: run the example; vary thrust and body-rate limits; test with a mismatched plant. |
| RL-36 | "Champion-level drone racing using deep reinforcement learning", Elia Kaufmann, Leonard Bauersfeld, Antonio Loquercio, Matthias Müller, Vladlen Koltun, Davide Scaramuzza, *Nature* 620, 30 August 2023; [DOI](https://doi.org/10.1038/s41586-023-06419-4); [data and pseudocode record](https://doi.org/10.5281/zenodo.7955278) | Primary frontier system; 7 h critical; RL, D, estimation; data only, source withheld per the paper's availability statement | Privileged simulation training, race protocol, latency, failure causes. Task: reproduce in simulation only; compare against a model-based baseline with identical gates and sensing. Do not generalize racing to unrestricted flight. |

### 7.6 What the recent slice does and does not establish

**[JUDGMENT]** RL-14 and RL-21 are surveys and prove nothing about which method wins. RL-17, RL-22, RL-25, RL-26, RL-28, RL-29, RL-35, RL-36 are primary results valid under their reported protocols only. RL-31 is peer-reviewed benchmark counterevidence, not a replicated consensus. RL-30 remained a preprint in the checks made here. Open checkpoints lower the entry barrier but do not make full pretraining reproducible, and they do not remove embodiment mismatch, calibration, compute, reset labour, licensing, or safety constraints. No just-posted 2026 preprint was promoted to the core list merely because its date is close to the report date.

---

## 8. Structured curriculum (M0–M11)

### 8.1 One selective chain, with full courses kept as optional catalogs

**[JUDGMENT]** Every plan takes **160 unique F hours**; the 20 h plan adds **90 F extension hours**, for 250. The module allocation below is the **Track-B default**. Track A or C keeps the same Q1–Q3 hours and applies the exact Q4–Q8 substitutions in §14.2, so neither aerial modules nor their hours remain mandatory on another track. Provider/full-study hours remain visible for diagnosed depth but are never added to the schedule. Course concepts learned in F time and project work done in B/E time are separate hours. Seven NPTEL runs had optional ₹1,000 certificate exams in 2026; no certificate or future rerun is required.

| Module | Exact course, instructors, institution, term | Access and cost | Provider/full route → **10 h core + 20 h extension** | Prerequisites | Required extract and integrated output | Q/P/D/V/C |
|---|---|---|---|---|---|---|
| **M0** Mathematical foundations | [*Mathematical Foundations for Machine Learning*, Prof. Ashok Rao (IISc) and Prof. Arulalan Rajan (NITK Surathkal), NPTEL, July–October 2026](https://onlinecourses.nptel.ac.in/noc26_cs128/preview); [record](https://nptel.ac.in/courses/106108702) | Free; 2026 certificate was optional ₹1,000 | 30 h provider → **30 + 10 h** | School mathematics | Linear algebra, probability, multivariable calculus selections; gradient/covariance notebook used by Rung 0/2 | 4/2/3/3/5 |
| **M1** ODE/optimization bridge | [MIT OCW 18.03, Haynes Miller and Arthur Mattuck, Spring 2010](https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/) + [Stanford EE364A, Logan Bell and Nikhil Devanathan on Stephen Boyd's page, Summer 2025–26](https://web.stanford.edu/class/ee364a/) | Free; EE364A recordings restricted | 70–80 h selected/full → **15 + 15 h** | Calculus, linear algebra | Linear systems/Laplace/phase plane plus convexity and CVXPY basics; one constrained trajectory problem inside Rung 1 | 5/3/4/5/3 |
| **M2** Rigid-body robotics | [*Modern Robotics*, Northwestern, Kevin M. Lynch; free book/videos/software](https://hades.mech.northwestern.edu/index.php/Modern_Robotics); [Coursera six-course route](https://www.coursera.org/specializations/modernrobotics) | Free official route; Coursera purchase optional | 153 h displayed → **25 + 15 h** | Calculus, linear algebra, programming | Chs. 2–6 plus planning/control extracts; transforms, Jacobian, dynamics, planner artifacts inside Rungs 1/3 | 5/3/4/5/3 |
| **M3** Control | [*Control Engineering for Robotics*, Prof. Chayan Bhawal, IIT Guwahati, NPTEL, Jan–Apr 2026](https://onlinecourses.nptel.ac.in/noc26_ee02/preview); [record](https://nptel.ac.in/courses/108103863) | Free; optional 2026 ₹1,000 certificate | 30 h provider / ≈80 h with work → **25 + 10 h** | M0–M2 | Modeling, PID, state space, controllability/observability, LQR; Rung-1 comparison | 4/3/4/4/5 |
| **M4** Mechatronics literacy | **[STALE-BUT-FOUNDATIONAL]** [*Mechatronics*, Prof. Pushparaj Mani Pathak, IIT Roorkee, 2026 rerun](https://onlinecourses.nptel.ac.in/noc26_me83/preview); [archive](https://nptel.ac.in/courses/112107298) | Free; recordings exposed as **2018** and include 2019 examples | 20 h provider / 45 h broad → **10 + 5 h** | Basic circuits/dynamics | Sensors, actuators, ADC/PWM, buses, power and fault literacy; current toolchain supplement: [Raspberry Pi Pico C/C++ SDK v2.3.1, 4 September 2026](https://github.com/raspberrypi/pico-sdk/releases/tag/2.3.1). Simulation only unless supervised | 3/2/3/3/2 |
| **M5** ROS 2 | [ROS 2 Jazzy official tutorials](https://docs.ros.org/en/jazzy/Tutorials.html); [source revised 14 May 2026](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Tutorials.rst) | Free | 45–60 h broad → **10 + 5 h** | Linux, Python/C++ | Nodes/topics, service/action, TF2, launch, QoS, bag replay; Rung-3 graph | 5/2/3/5/5 |
| **M6** DL primer | [MIT 6.S191, Alexander Amini, Ava Amini, Sadhana Lolla, Daniela Rus, 2026](https://introtodeeplearning.com/) | Free | 25–35 h broad → **5 + 0 h** | Derivatives, matrices, Python | Current overview and one notebook; skip by challenge artifact if already competent | 4/2/2/4/4 |
| **M7** Vision | [*Deep Learning for Computer Vision*, Prof. Vineeth N. Balasubramanian, IIT Hyderabad, NPTEL, Jul–Oct 2026](https://onlinecourses.nptel.ac.in/noc26_cs174/preview); [record](https://nptel.ac.in/courses/106106224) | Free; optional 2026 ₹1,000 certificate | 30 h provider / 95 h broad → **15 + 10 h** | Basic ML, probability, Python | Assignment 0 plus calibration/shift extracts; compact landing-pad model inside Rung 4/6 | 4/3/4/5/5 |
| **M8** RL | [*Reinforcement Learning*, Prof. Balaraman Ravindran, IIT Madras, NPTEL, Jul–Oct 2026](https://onlinecourses.nptel.ac.in/noc26_cs134/preview); [record](https://nptel.ac.in/courses/106106143) | Free; optional 2026 ₹1,000 certificate | 30 h provider / 80 h broad → **5 + 10 h** | Probability, linear algebra, Python | MDP/Bellman/TD essentials; only the 20 h extension trains a deeper baseline | 4/3/4/4/5 |
| **M9** Aeromechanics | [*Aeromechanics of Unmanned Aerial Vehicles / Drones*, Prof. Abhishek, IIT Kanpur, Jan–Apr 2026](https://onlinecourses.nptel.ac.in/noc26_ae03/preview); [25-lecture record](https://nptel.ac.in/courses/101104807) | Free; optional 2026 ₹1,000 certificate | 30 h provider / 60 h broad → **5 + 0 h** | Mechanics, calculus | Hover-power, forces/moments, stability extracts tied to Rung 4 | 4/2/3/4/5 |
| **M10** Aerial perception/planning | [*Principles of Perception and Planning for Aerial Vehicles*, K. Madhava Krishna, Harikumar Kandath, Antony Thomas, IIIT Hyderabad/NPTEL, Jul–Oct 2026](https://onlinecourses.nptel.ac.in/noc26_ae22/preview); [52-lecture record](https://nptel.ac.in/courses/101106001) | Free; optional 2026 ₹1,000 certificate | 30 h provider / 80 h broad → **10 + 5 h** | Linear algebra, calculus, control | Kalman/SLAM/planning/PX4 lectures 48–50; Rung-4 SITL report | 4/3/4/5/5 |
| **M11** Advanced integration | [Stanford CS224R, Prof. Chelsea Finn, Spring 2026](https://cs224r.stanford.edu/) + [MIT *Underactuated Robotics*, Russ Tedrake, Spring 2024 materials](https://underactuated.csail.mit.edu/) | Free; current CS224R recordings not promised | 165 h broad catalog → **5 + 5 h** | M7–M8; advanced dynamics | One track-specific lecture/assignment extract only. No mandatory Drake dependency; the project reproduction is budgeted under Rung 5 | 5/5/5/5/4 |
| **Track-B allocation total** | Full catalog remains optional | Core free | **160 h + 90 h = 250 h** | | Track A/C preserve these totals through §14.2 substitutions | |

### 8.2 Default Track-B placement over 24 months; §14.2 overrides Q4–Q8 for A/C

This table binds the default Track-B F-hour placement. Months 1–9/Q1–Q3 are common. After the end-of-month-9 choice, §14.2 is the binding A/C replacement; §15.5 gives default-B month deliverables and §14.3 gives the A/C replacements.

| Quarter / months | 10 h plan F hours: exact module assignment | 20 h extension F hours | Same work appears as project evidence / gate |
|---|---:|---:|---|
| Q1 / 1–3 | M0 30 + M1 15 + M2 5 = **50** | M0 +10, M1 +15, M2 +10 = **35** | Rung 0/early 1; Q1 deterministic rerun, units, least squares, feedback memo |
| Q2 / 4–6 | M2 15 + M3 15 + M4 5 = **35** | M2 +5, M3 +10, M4 +5 = **20** | Rung 1; Q2 frames, dynamics/control, timing/power literacy |
| Q3 / 7–9 | M2 5 + M3 10 + M4 5 + M5 5 = **25** | M5 +5, M7 +5 = **10** | Rungs 2–3; Q3 estimator/planner and replayable ROS metrics; **choose track** |
| Q4 / 10–12 | M5 5 + M6 5 + M7 5 = **15** | M7 +5, M8 +5 = **10** | Default-B Rung-4 closed-loop pilot; A/C use §14.2 |
| Q5 / 13–15 | M7 10 + M8 2 = **12** | M8 +5, M10 +3 = **8** | Rung 5; Q5 reproduction/discrepancy |
| Q6 / 16–18 | M8 3 + M9 5 + M10 2 = **10** | M10 +2, M11 +3 = **5** | Rung 6 exploratory study; Q6 freeze |
| Q7 / 19–21 | M10 3 + M11 5 = **8** | M11 +2 = **2** | Confirmation, independent rerun, artifact; Q7 |
| Q8 / 22–24 | M10 5 = **5** | **0** | Manuscript/portfolio; Q8 |
| **Total** | **160** | **90** | Exactly matches §15.3 F columns |

Module totals across rows equal §8.1. The 20 h extension still follows the same dependency order; its early M7 five-hour primer is only foundational neural-network tooling, not a vision project before control/ROS gates.

### 8.3 Alternatives that answer a real constraint

Every alternative **replaces** the corresponding module slice and its hours; it never adds to the 1,040-hour plan. Full-course estimates describe the catalog, not required work.

| Constraint | Switch to | Verified facts and score |
|---|---|---|
| Weak linear algebra | [MIT OCW 18.06SC *Linear Algebra*, Gilbert Strang, Fall 2011](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/) | Free, self-contained with exams; 110–150 h; 5/2/4/4/2 |
| Weak probability/statistics | [MIT OCW 18.05 *Introduction to Probability and Statistics*, Jeremy Orloff and Jennifer French Kamrin, Spring 2022](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/) | Free; 90–130 h; 5/2/4/4/4 |
| Aerospace state-space depth over a certificate | [MIT OCW 16.30 *Feedback Control Systems*, Jonathan P. How and Emilio Frazzoli, Fall 2010](https://ocw.mit.edu/courses/16-30-feedback-control-systems-fall-2010/) | Free notes and assignments, no complete video set; 90–130 h; 5/3/4/4/2 |
| Six-hour controls refresher before M3 | [*Robot Control Lecture (2025)*, M. Sodano, University of Bonn / StachnissLab](https://www.youtube.com/playlist?list=PLgnQpQtFTOGT_BlLxVnsuI-7CEQCgNuk4) | Six lectures, 14 April–21 May 2025, 5 h 31 min; no assignments; 4/2/2/3/4 |
| Manipulation specialization after the core | [MIT *Robotic Manipulation: Perception, Planning, and Control*, Russ Tedrake](https://manipulation.csail.mit.edu/) | Living notes marked 2020–2026; Fall 2026 term still underway at the cutoff; 120–180 h; 5/5/5/5/5 |
| Deeper vision with a harder project load | [Stanford CS231n, Spring 2026, Fei-Fei Li, Ehsan Adeli, Justin Johnson, Zane Durante, Tiange Xiang](https://cs231n.stanford.edu/) | Public notes and assignments; 2026 videos restricted; 120–180 h; 5/4/5/5/5 |
| Geometric visual odometry depth | [UZH/ETH *Vision Algorithms for Mobile Robotics*, Fall 2026, Davide Scaramuzza](https://rpg.ifi.uzh.ch/teaching.html) | Current term; public slides and exercises delivered through 15 October 2026 at the cutoff; recordings restricted; 110–150 h; 5/4/5/5/5 |
| Broader deep-RL theory instead of CS224R | [UC Berkeley CS 185/285 *Deep Reinforcement Learning*, Spring 2026, Sergey Levine](https://rail.eecs.berkeley.edu/deeprlcourse/) | Public slides and homework; Fall 2023 recordings public; 160–220 h; 5/5/5/5/5. Do not take both in the first 1,040 h. |
| M8 too steep | [Hugging Face *Deep Reinforcement Learning Course*](https://huggingface.co/learn/deep-rl-course/unit0/introduction) | Free; site says low-maintenance; Unit 7 and leaderboard nonfunctional; 3/2/3/4/2 |
| Real-time C and a physical microcontroller lab | [UTAustinX *Embedded Systems – Shape The World: Microcontroller Input/Output*, Jonathan Valvano and Ramesh Yerraballi, edX](https://www.edx.org/learn/embedded-systems/the-university-of-texas-at-austin-embedded-systems-shape-the-world-microcontroller-input-output) | Page modified 18 November 2024; 8 weeks × 9 h; free audit; verified certificate USD 199 ≈ ₹18,890; kit extra; 5/2/4/5/3 |
| Sensor-interface depth for a trained engineer | [NPTEL *Embedded Sensing, Actuation and Interfacing Systems*, Banibrata Mukherjee, IIT Kharagpur, January–April 2026](https://onlinecourses.nptel.ac.in/noc26_ee41/preview) | Free; optional ₹1,000 certificate; postgraduate level; 4/4/4/4/5 |
| Fixed-wing aerodynamics after M9 | [MIT OCW 16.100 *Aerodynamics*, David Darmofal, Fall 2005](https://ocw.mit.edu/courses/16-100-aerodynamics-fall-2005/) | Free; 120–170 h; requires fluid mechanics; 5/4/5/4/2 |

**Excluded [FACT]:** the former UPenn Coursera *Aerial Robotics* and *Robotics: Perception* URLs returned HTTP 404 on 20 October 2026; OpenAI *Spinning Up* identifies itself as a 2018 revision; the Stanford Robotics Seminar monitoring URL returned 404; no paid ROS course was selected because the official Jazzy tutorials plus the 2026 NPTEL PX4/ROS 2 lectures give a version-pinned path.

---

## 9. Tiered books and chapters

Do not read cover to cover. Free author-hosted editions are preferred; buy only for annotation or long-term reference. Price snapshots are from 20 October 2026 and exclude tax unless stated.

| Tier | Exact book, edition, access | Read for this roadmap | Hours; Q/P/D/V/C | Note |
|---|---|---|---|---|
| 0 Prerequisites | [*Mathematics for Machine Learning*, Deisenroth, Faisal, Ong, Cambridge UP, 2020; free corrected author PDF](https://mml-book.github.io/) | Chs. 2–7 | 45–70 h; 5/2/4/4/4 | Mathematics only, by design. |
| 1 Core | [*Modern Robotics*, Lynch and Park, Cambridge UP, 2017; free updated preprint](https://hades.mech.northwestern.edu/index.php/Modern_Robotics) | Chs. 2–6, 8–11, 13; ch. 12 for manipulation | In M2; 5/3/4/5/3 | Complete exercises and projects. |
| 1 Core | [*State Estimation for Robotics*, 2e, Barfoot, Cambridge UP, 2024; author copy](https://asrl.utias.utoronto.ca/~tdb/bib/barfoot_ser24.pdf) | Probability and estimation machinery; linear-Gaussian and nonlinear batch/sequential estimation; 3-D geometry and Lie groups; localization, mapping, pose graphs | 60–100 h selected; 5/5/5/5/5 | Use the author's four-lecture short course first. |
| 1 Core | [*Computer Vision: Algorithms and Applications*, 2e, Szeliski, Springer, 2022; personal-use author PDF](https://szeliski.org/Book/) | Image formation, features, multi-view geometry, motion and structure, recognition, deep-learning sections aligned to M7/M10 | 60–90 h selected; 5/4/5/5/4 | Author site updated 11 August 2025. |
| 1 Core | [*Feedback Systems*, Åström and Murray, Princeton UP, 2008; author electronic copy](https://www.cds.caltech.edu/~murray/books/AM08/pdf/fbs-public_24Jul2020.pdf) | Feedback, stability, loop shaping, state feedback, observers, robustness | 45–65 h; 5/3/5/5/3 | Companion to M3. |
| 2 Advanced | [*Planning Algorithms*, LaValle, Cambridge UP, 2006; free author HTML/PDF](https://lavalle.pl/planning/) | Chs. 2–5, 7–8, 11, 13–15 | 60–100 h selected; 5/4/5/5/2 | Durable theory; dated tooling. |
| 2 Advanced | [*Reinforcement Learning: An Introduction*, 2e, Sutton and Barto, MIT Press, 2018; free author PDF](http://incompleteideas.net/book/the-book-2nd.html) | Chs. 3–6, 9–13 | 60–90 h; 5/4/5/5/4 | Pair with current deep-RL assignments. |
| 2 Advanced | [*Algorithms for Decision Making*, Kochenderfer, Wheeler, Wray, MIT Press, 2022; free CC BY-NC-ND PDF](https://algorithmsbook.com/decisionmaking/) | Part II sequential problems; Part III model uncertainty and imitation; Part IV belief-state planning | 60–90 h selected; 5/4/5/5/4 | Connects planning, RL, uncertainty, validation. |
| 2 Advanced | [*Deep Learning*, Goodfellow, Bengio, Courville, MIT Press, 2016; free HTML](https://www.deeplearningbook.org/) | Chs. 6–11 as derivation support | 35–55 h selected; 5/4/5/3/2 | **[STALE-BUT-FOUNDATIONAL]**: pre-transformer; not a sole current DL source. |
| 2 Advanced | *Probabilistic Robotics*, Thrun, Burgard, Fox, MIT Press, 2005; [publisher record](https://mitpress.mit.edu/9780262201629/probabilistic-robotics/) | Bayes filters, particle filters, localization, mapping, SLAM | 40–60 h selected; 5/4/5/4/2 | **[STALE-BUT-FOUNDATIONAL]**; library or purchase. |
| 3 Specialization | [*Introduction to Multicopter Design and Control*, Quan Quan, Springer Singapore, 2017](https://link.springer.com/book/10.1007/978-981-10-3382-7) | Propulsion modeling, dynamics, calibration/estimation, low-level and position control, health and failsafe | 55–85 h selected; 4/4/5/5/3 | **[FACT]** snapshot 20 October 2026: eBook EUR 67.40 incl. India VAT ≈ ₹7,175; softcover EUR 55.99 ≈ ₹5,961; hardcover EUR 83.99 ≈ ₹8,941 (both before VAT). Prefer a library; the NPTEL aerial course already draws on it. |
| 3 Specialization | *Small Unmanned Aircraft: Theory and Practice*, Beard and McLain, Princeton UP, 2012; [DOI](https://doi.org/10.1515/9781400840601); [companion code](https://github.com/byu-magicc/mavsim_public) | Aircraft models, estimation, autopilot design, path following | 45–70 h selected; 5/4/5/5/2 | **[STALE-BUT-FOUNDATIONAL]**; fixed-wing emphasis. |
| 3 Specialization | *Mechanics of Robotic Manipulation*, Mason, MIT Press, 2001; [DOI](https://doi.org/10.7551/mitpress/4527.001.0001) | Contact kinematics, friction, grasping, pushing | 35–50 h selected; 5/4/5/5/2 | **[STALE-BUT-FOUNDATIONAL]**; library access. |
| 3 Reference | [*Factor Graphs for Robot Perception*, Dellaert and Kaess, 2017; author PDF](https://www.cs.cmu.edu/~kaess/pub/Dellaert17fnt.pdf) | Full monograph | 16–24 h; 5/4/5/5/4 | Tutorial; GTSAM is a separate implementation ecosystem. |

---

## 10. Substantive media: lectures, seminars, talks, podcasts, feeds

Selection rule **[JUDGMENT]**: full university lectures, official seminars, conference tutorials tied to papers and code, and interviews with technical detail displace motivational, generic, or demo-only media. Fame, views, and conference prestige are not quality scores. Every retained talk must produce a claim/assumption/evidence memo and one follow-up paper, code check, or experiment.

### 10.1 Evergreen lecture and seminar series

| Series | Verified activity and scope | Use and prerequisite | Q/P/D/V/C |
|---|---|---|---|
| [MIT 6.S191 2026 playlist](https://www.youtube.com/playlist?list=PLtBw6njQRU-rwp5__7C0oIVt26ZgjG9NI) | Nine 2026 lectures released Mondays 30 March–25 May: foundations, transformers, CNNs, generative modeling, RL, language-model frontiers, governance, AI for science, parallel training | M6 only; industry sponsors disclosed on the course page, so verify product claims separately | 4/2/2/4/5 |
| [Modern Robotics video supplements](https://modernrobotics.northwestern.edu/) | Chapter-aligned short videos (2017) with transcripts and free software | With derivations and projects, not passively | 5/3/4/4/3 |
| [MIT Underactuated Robotics, Spring 2024](https://www.youtube.com/playlist?list=PLkx8KyIQkMfU5szP43GlE_S1QGSPQfL9s) | Complete 24-lesson course paired with living notes | After M2–M3; primary nonlinear/model-based series | 5/5/5/5/3 |
| [Robot Control Lecture (2025), University of Bonn / StachnissLab](https://www.youtube.com/playlist?list=PLgnQpQtFTOGT_BlLxVnsuI-7CEQCgNuk4) | Six lectures, 14 April–21 May 2025, 5 h 31 min | Fast review only; the final title spells the lecturer "M. Sondano" while the others say "M. Sodano" (inconsistency preserved) | 4/2/2/3/4 |
| [NPTEL *Principles of Perception and Planning for Aerial Vehicles*](https://nptel.ac.in/courses/101106001) | 52 lectures across 12 weeks in 2026; final block covers ROS 2, PX4, Gazebo, offboard control, RRT | Core aerial series after controls and geometry | 4/3/4/5/5 |
| [NPTEL *Aeromechanics of UAVs / Drones*](https://nptel.ac.in/courses/101104807) | 25 lectures uploaded February–April 2026 | Solve the rotor and endurance derivations | 4/2/3/4/5 |
| [CMU Robotics Institute Seminar Series playlist](https://www.youtube.com/playlist?list=PLCFD85BC79FE703DF) | Official playlist active through 11 October 2026 | One seminar per month after prerequisites; expert synthesis, not independent validation | 5/4/4/4/5 |
| [IEEE Robotics and Automation Society channel](https://www.youtube.com/channel/UCvmXaE8AFihVzN9rN5de0Dw) | ICRA 2026 plenary/tutorial/panel batch uploaded 12 October 2026 | Select tutorials tied to code and papers; scrutinize industry keynotes | 4/3/3/4/5 |
| [RSS 2026 Keynotes and Early Career Spotlights](https://roboticsconference.org/2026/program/keynotes-spotlights/) | Completed conference 13–17 July 2026; talks include Salah Sukkarieh, "Field Robotics as a Science of Systems"; Karen Liu, "Data Poor, Model Rich"; Wenzhen Yuan on tactile manipulation; Marco Tognon on aerial physical interaction; Pulkit Agrawal on force intelligence and lifelong learning | Program and abstracts only; no public recording was observed | 5/4/4/4/5 |
| [MIT Robotics Seminar](https://robotics.mit.edu/robotics-seminar/) | Irregular Friday series verified through 16 October 2026; 2026 examples: Mac Schwager, "How General are Generalist Robot Policies?" (3 April); Melanie Zeilinger, "Learning for Complex Control Systems: Guarantees in the Unknown" (10 April); Seth Hutchinson, "Model-Based Methods in Today's Data-Driven Robotics Landscape" (24 April) | Event list; no general recording promise displayed | 5/4/4/3/5 |

### 10.2 Exact talks and episodes worth the time

| Item | Metadata | Why; prerequisite | Affiliation or hype note | Q/P/D/V/C |
|---|---|---|---|---|
| [MIT 6.S191: Convolutional Neural Networks](https://www.youtube.com/watch?v=pqIcoskUuWs) | 13 April 2026; 56.8 min | Compact CNN primer before M7 | Orientation only | 4/2/2/4/5 |
| [6.8210 Spring 2024 Lecture 10: Trajectory Optimization I](https://www.youtube.com/watch?v=wND0k16gCdk) | Russ Tedrake, MIT; 17 March 2024; 78.9 min | Direct transcription and collocation for M1/M3/M11 | Pair with current Drake docs | 5/5/5/5/3 |
| [6.8210 Spring 2024 Lecture 21: Robust Control & Policy Search](https://www.youtube.com/watch?v=eEOmmpA1GAw) | Russ Tedrake, MIT; 12 May 2024; 77.1 min | Bridge between model-based robustness and learning | One lecture does not settle model-based versus learned control | 5/5/5/5/3 |
| [Lecture 48 — Introduction to PX4, Gazebo & ROS 2](https://www.youtube.com/watch?v=WHVHVeuDq4w) | NPTEL-NOC IITM; 1 October 2026; 27 min 7 s | Setup context for M10 | Verify versions against the pinned stack | 4/3/3/5/5 |
| [Lecture 49 — Offboard Control with PX4 & ROS 2](https://www.youtube.com/watch?v=37sYwngRcOs) | NPTEL-NOC IITM; 1 October 2026; 42 min 11 s | Supports the Rung 4 offboard-control artifact | Keep offboard control in SITL until later gates | 4/3/3/5/5 |
| [Lecture 50 — RRT Path Planning with PX4, ROS 2 & Gazebo](https://www.youtube.com/watch?v=ro903djNR-Y) | NPTEL-NOC IITM; 1 October 2026; 30 min 58 s | Integrates planning, middleware, simulator, autopilot | A lecture demo is not field evidence | 4/3/3/5/5 |
| [ICRA 2026 Keynote Tutorial 1 — Learning Agile Vision-based Quadrotor Flight](https://www.youtube.com/watch?v=8o1H7OJrPx8) | IEEE RAS upload, 12 October 2026; 80.5 min; speakers Davide Scaramuzza, Rudolf Reiter, Ismail Geles per the [UZH announcement](https://rpg.ifi.uzh.ch/) | End-to-end aerial learning tutorial after M7–M10 | Speakers' lab produced many of the systems shown; papers, code, and independent tests still needed | 4/4/4/5/5 |
| [RI Seminar — Jitendra Malik: Robot Learning, With Inspiration From Child Development](https://www.youtube.com/watch?v=ry8itipzBFE) | CMU RI; 13–14 February 2026; 67.2 min | Sensorimotor-learning framing after DL and robotics | Synthesis, not benchmark comparison | 5/4/4/4/5 |
| [RI Seminar — Max Simchowitz: Generative Control, Action Chunking, and Moravec's Paradox](https://www.youtube.com/watch?v=UX1YXcRnFbs) | CMU RI; 14 March 2026; 56.6 min | Control meets generative policies and action chunking | Treat claims as prompts for paper reading | 5/5/5/4/5 |
| [RI Seminar — Hadas Kress-Gazit: Formal Methods for Robotics in the Age of Big Data](https://www.youtube.com/watch?v=gthXSFhDt8Q) | CMU RI; 25 March 2026; 64.9 min | Counterweight to purely empirical robot learning | Guarantees hold only under stated models | 5/5/5/4/5 |
| [RI Seminar — Leslie Kaelbling: The Role of Rationality in Modern Robotics](https://www.youtube.com/watch?v=r1oAw_KWLWg) | CMU RI; 20 April 2026; 74.6 min | Decision-making and architecture perspective after M8 | Argument, not empirical result | 5/4/4/4/5 |
| [*The Robot Brains Podcast* S3 E20 — Jitendra Malik on sensorimotor learning before language](https://www.youtube.com/watch?v=k_Wrd1kI1B0) | Host Pieter Abbeel; 16 August 2023; 91.5 min | Long-form complement to the 2026 seminar | Archive: the channel's latest verified upload was this episode | 4/3/3/3/2 |
| [*The Robot Brains Podcast* S3 Ep 11 — Raffaello D'Andrea: Making Drones Useful](https://www.youtube.com/watch?v=DgwhJnkmxZw) | Host Pieter Abbeel; 24 May 2023; 61.8 min | Systems and productization perspective (Kiva, Verity, ETH) | Founder interview; commercial success is not autonomy evidence | 4/3/3/4/2 |
| [*Sense Think Act* — Louise Poubel: Simulate What You Want and Not What You Don't with Gazebo](https://www.youtube.com/watch?v=0aP5e2PX0wA) | Host Audrow Nash; 9 June 2023; 96.9 min | Simulator architecture and limits from a former Gazebo lead | Versions predate the 2026 stack | 4/3/3/5/2 |
| [*Sense Think Act* — Steve Macenski: Open Source Robot Navigation](https://www.youtube.com/watch?v=opLHFBa4Gxo) | Host Audrow Nash; 8 February 2022; 86 min | Nav2 architecture, behavior trees, control | Check every API against current Nav2 | 4/3/3/5/1 |
| [*The Robot Report Podcast* — Why humanoid robot demos still fail the generalization test](https://soundcloud.com/robot-report-podcast/generalization-test) | Hosts Mike Oitzman and Gene Demaitre; guest Janine Sinanan-Singh (Appen); 9 October 2026; 78 min 18 s | Checklist of what demos omit: data, latency, evaluation, oversight | **[HYPE/DEMO] detector**: trade media with a vendor guest and sponsor segment; a source of questions, not proof | 3/2/2/3/5 |

### 10.3 Podcasts: archive versus monitoring

| Show | Verified cadence | Decision |
|---|---|---|
| [*Sense Think Act Podcast*, Open Robotics](https://www.youtube.com/c/SenseThinkActPodcast) | 41 long-form episodes; latest substantive upload 10 January 2025; host Audrow Nash stepped down in November 2023 | **Archive only.** Search for exact maintainers of Gazebo, Nav2, MoveIt, OSRA. |
| [*The Robot Brains Podcast*, Pieter Abbeel](https://www.youtube.com/channel/UCXNviQjBONXljxkJzNV-Xbw) | Last verified upload 16 August 2023 | **Archive only.** |
| [*The Robot Report Podcast*](https://feeds.soundcloud.com/users/soundcloud:users:830627836/sounds.rss) | Weekly episodes 28 August–16 October 2026 in the checked feed | **Active industry monitor**, at most one episode a month; vendor claims need primary checks. |

Excluded: broad celebrity interview podcasts and vendor-wide shows; a famous guest is not a selection criterion.

### 10.4 Newsletters, lab blogs, and release feeds

| Source | Verified cadence at cutoff | Use and keep/drop rule | Limit |
|---|---|---|---|
| [*Import AI*, Jack Clark](https://importai.substack.com/feed) | Weekly Monday issues through no. 477 on 19 October 2026 | Scan headings weekly; keep only items linking a paper, benchmark, policy document, or artifact | Personal synthesis; never the sole source for performance or safety |
| [Berkeley AI Research Blog RSS](https://bair.berkeley.edu/blog/feed.xml) | Irregular; ten posts September 2025–29 July 2026 | Monthly scan; save the primary paper | Lab post + paper + code are one family |
| [UZH Robotics and Perception Group news](https://rpg.ifi.uzh.ch/) | Very active through 20 October 2026 | Weekly only for aerial/event-vision specialization | **[HYPE/DEMO]**: first-party "superhuman" or "zero-shot" titles are discovery claims until protocol and independent tests are checked |
| [IEEE Spectrum Robotics RSS](https://spectrum.ieee.org/feeds/topic/robotics.rss) | Multiple posts a week; latest 19 October 2026 | Monthly industry/hardware scan; drop novelty compilations | "Video Friday" is demo discovery, not reliability evidence |
| [OSRA Announcements and News RSS](https://discourse.openrobotics.org/c/osra-announcements-news/116.rss) | Event-driven; posts through 26 August 2026 | Monthly scan for governance and compatibility | Announcement source |
| [ROS 2 releases Atom](https://github.com/ros2/ros2/releases.atom) | Lyrical patches through 8 August 2026; Humble patch 15 on 14 September 2026 | Subscribe only for the pinned distribution | A release is not a reason to upgrade mid-study |
| [Nav2 releases Atom](https://github.com/ros-navigation/navigation2/releases.atom) | Releases 1.5.3 and 1.3.14 on 17 October 2026 | Pin and add a regression test before updating | Version numbers do not establish distro compatibility |
| [PX4 Autopilot releases Atom](https://github.com/PX4/PX4-Autopilot/releases.atom) | Stable v1.17.0 in May 2026; v1.18.0-rc1 appeared 10 September 2026 | Subscribe during M10; stable releases only | **[HYPE/DEMO]**: a release candidate is not stable |

**Bounded cadence [JUDGMENT]:** at most 45 minutes a week on these feeds (15 for releases, 15 for one lab or conference feed tied to the active project, 15 for one synthesis feed), inside the 120-minute monitoring budget of §17. Delete a feed after eight weeks without an experiment, implementation, or literature-table entry.

### 10.5 Media-use rules against overclaiming

1. A demo is a test case, not a distribution: ask for task distribution, training overlap, denominator, interventions, resets, failures, latency, energy, and safety envelope.
2. First-party evidence is one family.
3. Separate offline scores from closed-loop evidence.
4. Do not transfer "generalist" across embodiments without explicit robots, sensors, action spaces, and held-out embodiments.
5. Check dates inside "current" course pages (the 2026 Mechatronics rerun uses 2018 recordings; public CS224R/CS285 recordings are from earlier terms).
6. Treat vendor and founder interviews as scoped testimony.
7. Ignore popularity.
8. Convert every retained item into a memo and a follow-up action, or stop watching.

---

## 11. Practical stack, versions, and the experimental standard

### 11.1 Documented-compatibility profile, **not an integration-tested manifest**

**[JUDGMENT]** Use the choices below to begin, but do not call the resulting system reproducible until §11.2's smoke tests pass and every resolved package/image is recorded. Upstream documentation supports the major pairings; this report did not install the integrated ROS/Gazebo/PX4 stack, did not publish a container digest, and did not verify a single PyTorch wheel against it.

| Layer | Documented choice | Evidence and unresolved integration detail |
|---|---|---|
| Host OS | Ubuntu 24.04 LTS, x86-64 | Tier-1 platform for ROS 2 Jazzy ([Jazzy release page](https://github.com/ros2/ros2_documentation/blob/jazzy/source/Releases/Release-Jazzy-Jalisco.rst)); officially supported by Gazebo Harmonic, whose Windows and macOS support is best-effort ([Harmonic install](https://github.com/gazebosim/docs/blob/master/harmonic/install.md)). |
| Middleware | ROS 2 Jazzy Jalisco | **[FACT]** Released 23 May 2024, supported to May 2029; Lyrical Luth is newer (released 22 May 2026, supported to May 2031, Tier 1 Ubuntu 26.04, default Gazebo Jetty, C++20, Python 3.12–3.14) but Gazebo still recommends Jazzy + Harmonic for new users ([ROS 2 distributions](https://github.com/ros2/ros2_documentation/blob/lyrical/source/Releases.rst); [Lyrical release](https://github.com/ros2/ros2_documentation/blob/lyrical/source/Releases/Release-Lyrical-Luth.rst); [Lyrical platforms](https://github.com/ros2/ros2_documentation/blob/lyrical/source/Releases/lyrical/supported-platforms.rst); [Gazebo/ROS pairing](https://github.com/gazebosim/docs/blob/master/common/ros_installation.md)). |
| Integrated simulator | Gazebo Harmonic (`gz-sim` 8) via `ros_gz` | **[FACT]** Harmonic: September 2023, LTS to May 2029; Jetty: September 2025, LTS to May 2031; Ionic EOL December 2026; Rotary experimental; the next fixed release was listed for March 2027 and is not available on the report date ([Gazebo releases](https://github.com/gazebosim/docs/blob/master/common/releases.md)). Apache-2.0. Do not start new work on Gazebo Classic. |
| Fast dynamics/policy simulator | MuJoCo 3.16.0 | **[FACT]** Released 14 October 2026; Apache-2.0; prebuilt Linux, Windows, macOS; Python ≥ 3.10 ([release](https://github.com/google-deepmind/mujoco/releases/tag/3.16.0); [README](https://github.com/google-deepmind/mujoco)). Treat its contact model as one hypothesis. |
| Learning framework | A project-pinned PyTorch wheel for Python 3.12 | **[UNCERTAIN]** PyPI showed 2.14.1 on 20 October 2026 while the server-rendered official selector still displayed "Stable 2.7.0" ([PyPI](https://pypi.org/project/torch/); [selector](https://pytorch.org/get-started/locally/)). Record the exact wheel and hash that passes your tests; do not claim an untested "latest". |
| Aerial SITL | PX4 v1.17.0 + Gazebo Harmonic + QGroundControl v5.1.5 | **[FACT]** PX4 v1.17.0 published 13 May 2026 (the release feed shows 14 May; a one-day time-zone difference), BSD-3-Clause; its Ubuntu setup script targets 24.04 and 22.04 and installs Gazebo Harmonic ([release](https://github.com/PX4/PX4-Autopilot/releases/tag/v1.17.0); [setup script](https://github.com/PX4/PX4-Autopilot/blob/v1.17.0/Tools/setup/ubuntu.sh); [Gazebo guide](https://github.com/PX4/PX4-user_guide/blob/main/en/sim_gazebo_gz/index.md)). QGC v5.1.5 published 1 October 2026; current docs list Windows 10/11, macOS 14.4+, Ubuntu 24.04/26.04, Android 9+; the Ubuntu 22.04 binary must be built by the user ([release](https://github.com/mavlink/qgroundcontrol/releases/tag/v5.1.5); [platforms](https://docs.qgroundcontrol.com/master/en/qgc-user-guide/getting_started/download_and_install.html)). |
| Build and environment capture | Distribution-provided GCC/CMake, `colcon`, `rosdep`, Python environment lock, and one OCI-compatible container tool | **[UNCERTAIN]** No exact compiler, CMake, colcon, rosdep, container version, or base-image digest was integrated in this report. Resolve from the official repositories, record `--version` outputs and package locks, and never use a mutable `latest` image in confirmatory work. |
| ROS middleware and bridge | One recorded RMW implementation plus distribution-resolved `ros_gz` | **[UNCERTAIN]** Exact Jazzy package revisions and `ros_gz` patch were not pinned or smoke-tested here. Record RMW name/version, QoS, apt snapshot, and bridge message types before Rung 3. |
| Aerial client | [MAVSDK v4.0.6, released 8 October 2026](https://github.com/mavlink/MAVSDK/releases/tag/v4.0.6), when an external API is needed | Release identity is verified; compatibility with this full profile was not integration-tested. Direct PX4 DDS stays in the separate Humble profile. |
| Visualization and logs | Distribution-resolved RViz 2; `ros2 bag`/MCAP where supported; PX4 ULog/QGroundControl | Exact package revisions were not pinned. Preserve raw logs and generate figures from tables; a visualization is not evidence. |
| Model-based tooling | NumPy/SciPy/CVXPY or the smallest project-pinned solver that passes the artifact tests | Drake is optional reference tooling only; no Drake version or container was verified, so no mandatory output depends on it. |
| Evidence | ROS bags/MCAP, PX4 ULog, immutable result tables, environment and asset manifests | A video is not an experiment. |

Planning target **[JUDGMENT]**: 8-core CPU, 16–32 GB RAM, 100 GB free SSD; headless runs without a discrete GPU cover most ROS, Gazebo, and MuJoCo exercises. Measure real-time factor on your scenes.

### 11.2 Installation and smoke-test acceptance

Run these in a disposable environment before Rung 3; retain commands, stdout/stderr, wall time, package list, and hashes. A failure narrows the stack instead of being hidden.

1. Install from the official Jazzy/Harmonic route; record Ubuntu build, kernel, CPU/GPU, Python patch, GCC, CMake, `colcon`, `rosdep`, RMW, all ROS/Gazebo packages, and container/base-image digest if used.
2. Build one Python and one C++ ROS package; pass publisher/subscriber, service/action, TF2 timestamp, QoS-loss, and bag record/replay checks.
3. Spawn one robot in Gazebo; bridge clock, command, pose, IMU, and camera/lidar as applicable; confirm reset reproducibility and measure real-time factor under headless and rendered modes.
4. Start PX4 v1.17.0 SITL and QGroundControl v5.1.5; export parameters, execute takeoff/hold/land in simulation, induce link loss, and verify the state transition from ULog rather than video.
5. If MAVSDK is used, connect v4.0.6 to SITL, read telemetry, command only the scripted simulated mission, and record message/API versions. If direct DDS is used, repeat only in the isolated Humble/22.04 profile.
6. Run the Rung-0 MuJoCo test and the selected paper environment independently. Never upgrade the learning stack in place during confirmatory evaluation.

**Status on this report date:** no integrated run was performed. The matrix is therefore a checked upstream compatibility plan, not a known-working lockfile or image.

### 11.3 Two separate compatibility profiles

1. **Direct autopilot-to-ROS DDS profile:** PX4's ROS 2 guide still names ROS 2 Humble on Ubuntu 22.04 as its supported platform, and ArduPilot's ROS 2 install page says Humble is the only supported distribution ([PX4 ROS 2 guide](https://github.com/PX4/PX4-user_guide/blob/main/en/ros2/user_guide.md); [ArduPilot ROS 2 install](https://github.com/ArduPilot/ardupilot_wiki/blob/master/dev/source/docs/ros2-install.rst)). Keep it in a separate container or machine; pin message definitions; record any PX4 message-translation node as part of the experiment.
2. **Newest-ROS evaluation profile:** Lyrical Luth in CI only; migrate nothing until every driver, bridge, and autopilot interface passes the same benchmark.

**[FACT]** ROS does not guarantee communication across distributions; a Humble node that appears to talk to Jazzy is not a supported deployment ([ROS 2 distributions, cross-distribution section](https://github.com/ros2/ros2_documentation/blob/lyrical/source/Releases.rst)).

### 11.4 Alternatives and when to switch

| Component | Verified status | Switch when | Caution |
|---|---|---|---|
| Isaac Sim / Isaac Lab | **[FACT]** Isaac Sim 6.2.0 (October 2026); Isaac Lab v3.0.0 published 20 October 2026 targeting Isaac Sim 6.2 (same-day release; higher migration risk); Lab core BSD-3-Clause, Isaac Sim and assets proprietary; official minimum RTX 4080 with 16 GB VRAM, 32 GB RAM, 50 GB SSD; GPUs without RT cores (including A100/H100) unsupported; Ubuntu 24.04 + Jazzy recommended ([Lab v3.0.0](https://github.com/isaac-sim/IsaacLab/releases/tag/v3.0.0); [requirements](https://docs.isaacsim.omniverse.nvidia.com/latest/installation/requirements.html); [ROS matrix](https://docs.isaacsim.omniverse.nvidia.com/latest/installation/install_ros.html); [licences](https://docs.isaacsim.omniverse.nvidia.com/latest/common/licenses.html)) | Many parallel environments, RTX sensors, synthetic data, USD pipelines | Not a beginner default; validate conclusions in MuJoCo/Gazebo or hardware |
| ArduPilot | **[FACT]** Active, GPL-3.0; Plane-4.7.2 on 14 October 2026 but Copter/Rover/Plane have separate release streams; Gazebo plugin LGPL-3.0 recommends Harmonic on Ubuntu 22.04 ([repository](https://github.com/ArduPilot/ardupilot); [plugin](https://github.com/ArduPilot/ardupilot_gazebo)) | Vehicle breadth, mission ecosystem, scripting, or a specific board is the dependency | Separate experimental factor; never mix autopilots inside a baseline |
| Betaflight | **[FACT]** 2026.6.2 released 16 September 2026, GPL-3.0; Gazebo waypoint material sits under development/autopilot ([release](https://github.com/betaflight/betaflight/releases/tag/2026.6.2); [SITL](https://www.betaflight.com/docs/development/SITL)) | Rate-loop, filter, latency, or FPV research | Not the default for ROS 2 autonomy or publishable offboard-control experiments |
| Microsoft AirSim (original) | **[UNCERTAIN]** Repository not marked archived and had 2026 housekeeping commits, but Microsoft's retained notice says no further updates and the latest binary is v1.8.1 from 18 July 2022 ([notice](https://github.com/microsoft/AirSim/blob/main/project_airsim.md); [v1.8.1](https://github.com/microsoft/AirSim/releases/tag/v1.8.1-windows)) | Reproducing existing AirSim work only | Legacy dependency; freeze Unreal and compiler versions |
| IAMAI Project AirSim | **[FACT]** v1.0.1 published 7 September 2026, MIT; Ubuntu 22.04, ROS 2 Humble, Unreal Engine 5.2/5.7/5.8, PX4/ArduPilot SITL ([release](https://github.com/iamaisim/ProjectAirSim/releases/tag/v1.0.1)) | Unreal visual worlds, weather, fixed-wing JSBSim, AirSim migration | Needs the Humble profile; younger reproducibility record |
| Webots | **[FACT]** R2025a released 4 February 2025, Apache-2.0, Linux/Windows/macOS; `webots_ros2` 2025.0.0 ([release](https://github.com/cyberbotics/webots/releases/tag/R2025a); [bridge](https://github.com/cyberbotics/webots_ros2)) | Cross-platform teaching or an existing Webots model | Gazebo has the stronger ROS/PX4 path |
| PyBullet | **[FACT]** GitHub release tag 3.25 from 24 April 2022; PyPI 3.2.7 uploaded 30 January 2025; issue tracker closed ([repository](https://github.com/bulletphysics/bullet3); [PyPI](https://pypi.org/project/pybullet/3.2.7/)) | Reproducing a PyBullet paper or course | Not the default for a new long-lived project |
| Crazyflie ecosystem | **[FACT]** Firmware 2026.08 (20 August 2026, GPL-3.0); `cflib` 0.1.34 (30 September 2026); community Crazyswarm2 (MIT) with ROS CI for Humble, Jazzy, Lyrical, Rolling; Bitcraze's minimal simulator says it is not actively maintained and not very realistic ([firmware](https://github.com/bitcraze/crazyflie-firmware/releases/tag/2026.08); [cflib](https://github.com/bitcraze/crazyflie-lib-python); [Crazyswarm2](https://github.com/IMRCLab/crazyswarm2); [simulator](https://github.com/bitcraze/crazyflie-simulation)) | Contained micro-aircraft hardware at Rung 8 | Does not validate PX4 claims |

**Simulator selection rule [JUDGMENT]:** use the smallest simulator that can falsify the claim: MuJoCo for dynamics, contact, and policy throughput; Gazebo for the ROS graph, sensors, Nav2, PX4/ArduPilot, and multi-process timing; Isaac for RTX sensing and GPU-parallel loads; Project AirSim for Unreal visual worlds. A result that survives two simulators with different physics and rendering assumptions is worth more than one from the prettiest simulator.

### 11.5 Isolated artifact/reproduction profiles and one canonical learner rule

| Profile | Immutable identity and task | Environment/compute facts | Smoke-test status and decision |
|---|---|---|---|
| **CPU artifact for Tracks B/C** | "Safe-Control-Gym: A Unified Benchmark Suite for Safe Learning-Based Control and Reinforcement Learning in Robotics" ([RA-L paper DOI](https://doi.org/10.1109/LRA.2022.3196132)). Use release [`v1.0.0`, published 21 October 2024](https://github.com/learnsyslab/safe-control-gym/releases/tag/v1.0.0), immutable commit [`dd1b293f3be1f3df56bb26cb66753e250afda00a`](https://github.com/learnsyslab/safe-control-gym/tree/dd1b293f3be1f3df56bb26cb66753e250afda00a). It contains the [README 2-D tracking command](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/README.md#2d-quadrotor-trajectory-tracking-with-ppo), [evaluation script](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/examples/rl/rl_experiment.py), [tracking task](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/examples/rl/config_overrides/quadrotor_2D/quadrotor_2D_track.yaml), [PPO config](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/examples/rl/config_overrides/quadrotor_2D/ppo_quadrotor_2D.yaml), and [released tracking checkpoint](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/examples/rl/models/ppo/ppo_model_quadrotor_2D_track.pt). Target locator: paper **Figure 5**, absolute 2-D quadrotor reference error for LQR, 150%-parameter-mismatched LQR, GP-MPC, PPO, and SAC; Figure 6 defines learning-curve evaluation cost as x/z RMSE for GP-MPC/PPO/SAC. | Artifact metadata are internally awkward: release tag `v1.0.0`, commit 5 May 2024, but [`pyproject.toml` declares package 2.0.0](https://github.com/learnsyslab/safe-control-gym/blob/dd1b293f3be1f3df56bb26cb66753e250afda00a/pyproject.toml) and Python `^3.10`, Torch `^1.10.2`, Gymnasium `^0.28`, CasADi `^3.6.0`, PyBullet `^3.2.0`; its build backend points to mutable `poetry-core` `main`. The checkpoint is 482,923 bytes, SHA-256 `be23fcaa6ff5ba17b730fd61fdd87c13592b84d99bef04081c598be273ed5c72`; script/config hashes are in the smoke record below. Repository licence is MIT; third-party licences still apply, and MOSEK-dependent paths require separate terms. | **Single-machine smoke observation with a partial manifest, 21 Oct 2026 revision check.** On Windows x86-64 with an Intel Core Ultra 5 135U (12 cores/14 logical processors), Python 3.10.22, Torch 1.13.1+cpu, PyBullet package 3.2.5 (conda-forge build 3.25), CasADi 3.8.1, Gymnasium 0.28.1, NumPy 1.26.4, CVXPY 1.7.5, scikit-learn 1.7.2, `poetry-core` 2.5.0 and setuptools 80.9.0, the README command arguments completed one 250-step randomized-start episode in 4.607 s on CPU; only `MPLBACKEND=Agg` was added to suppress an interactive plot: `average_rmse=0.311`, `failure_rate=1.000`, 78 violation steps. Installed environment 2.424 GiB; extracted source 104.647 MiB. Use **5 GiB storage and 10 CPU-minutes** as the smoke-test stop ceiling. Direct PyPI installation first failed because PyBullet needed absent MSVC; setuptools ≥81 also broke `munch`, hence the two disclosed pins. This proves one executable checkpoint path only. The README performance table is random-action simulator throughput and is **not** evidence for PPO evaluation speed or paper reproduction. |
| **Optional Track-A author reproduction** | Diffusion Policy commit [`5ba07ac`](https://github.com/real-stanford/diffusion_policy/tree/5ba07ac6661db573af695b419a7947ecb704690f). Faithful target: **image-conditioned Push-T training** with `image_pusht_diffusion_policy_cnn.yaml`. Separate task: README's **low-dimensional Push-T checkpoint evaluation** | Author environment pins Python 3.9, PyTorch 1.12.1, CUDA 11.6, PyMunk 6.2.1; commands select `cuda:0` ([environment](https://github.com/real-stanford/diffusion_policy/blob/5ba07ac6661db573af695b419a7947ecb704690f/conda_environment.yaml); [Push-T PyMunk imports](https://github.com/real-stanford/diffusion_policy/blob/5ba07ac6661db573af695b419a7947ecb704690f/diffusion_policy/env/pusht/pusht_env.py#L7-L9)). Upstream does not state minimum VRAM or wall time. HEAD checks on 20 October 2026 found ≈4.29 GB for the [image `latest.ckpt`](https://diffusion-policy.cs.columbia.edu/data/experiments/image/pusht/diffusion_policy_cnn/train_0/checkpoints/latest.ckpt) and ≈1.04 GB for the README's [low-dimensional checkpoint](https://diffusion-policy.cs.columbia.edu/data/experiments/low_dim/pusht/diffusion_policy_cnn/train_0/checkpoints/epoch=0550-test_mean_score=0.969.ckpt); data/log/storage beyond that are not established | **Smoke-test record: FAIL at preflight, 20 Oct 2026.** `nvidia-smi` was unavailable, so the immutable GPU environment could not be started and no scientific run was attempted. Full training is prohibited as a roadmap commitment until a 30-minute environment/checkpoint pilot records GPU, driver, peak VRAM, wall time, total storage, and cost ceiling. Software is free; accelerator/cloud cost is `not established`. A CPU run, dependency modernization, low-dimensional substitution, or MuJoCo port is an **adaptation**, never the faithful reproduction |

**CPU smoke-record hashes.** Observed GitHub source-archive SHA-256 `5ab883f4d4fd69ae5b1bfc8ec0af81152c3424c06ffe65d665513437d7942711`; `rl_experiment.py` `34c9ba30e901b95866bb99a2ee3d0758e5341a1a33faf8b777646ed800762fe0`; task YAML `79989f6e156578c4fd33c817560b10127c6dc8eb59a7a701a549f480e17df0ef`; PPO YAML `2181472d62cdd72ace1e8e18c73ade6bb303e89804ed651e658e620a76ee5481`; tracking checkpoint as above. The one-episode values are a **single-machine smoke observation with a partial manifest**, not an expected signature. They are not a paper result or a safety claim. A clean Ubuntu install must create its own signed manifest because the Windows workaround is not the upstream installation route.

**Copyable artifact-health command** (run from the immutable commit's `examples/rl/`; `MPLBACKEND=Agg` only suppresses the window):

```bash
MPLBACKEND=Agg python3 rl_experiment.py --algo ppo --task quadrotor \
  --overrides config_overrides/quadrotor_2D/quadrotor_2D_track.yaml \
              config_overrides/quadrotor_2D/ppo_quadrotor_2D.yaml \
  --kv_overrides algo_config.training=False
```

Stop if the commit or listed file/checkpoint hashes differ, storage exceeds 5 GiB, the first episode exceeds 10 CPU-minutes, or an undeclared dependency/licence is required. Preserve stdout before adding comparators. The observed failure rate of 1.0 is a warning that the released trajectory can violate configured constraints; it is not a reason to suppress the metric.

**Canonical evaluation rule.** A “seed” means an independent stochastic training seed; evaluation-only work instead uses independently generated scenario seeds. Episode counts are minimums unless a pilot-derived power/precision calculation justifies more.

| Plan and track | Artifact/reproduction | Simulator | Training seeds | Scenario seeds / evaluation episodes | Compute ceiling and fallback |
|---|---|---|---:|---:|---|
| 10 h, A | Optional image Push-T author profile | PyMunk | 3 | ≥5 / ≥100 per retained condition, while preserving any larger author-config count | Pilot first; one existing/institutional NVIDIA GPU only; if no declared VRAM/time/cost ceiling, switch to B/C |
| 10 h, B | `safe-control-gym` `v1.0.0` PPO checkpoint health check; add a predeclared available Figure-5 subset and call it a **partial reproduction**, or run all five published controller conditions before calling it a Figure-5 reproduction | PyBullet | 0 | ≥5 / ≥100 per condition | CPU only, no paid compute; 10-minute/5-GiB smoke ceiling; preserve dependency deviations |
| 10 h, C | Same `v1.0.0` PPO checkpoint health check plus constraint metrics; add a CBF/safety filter only if an exact task-compatible command/config and licence preflight passes | PyBullet | 0 unless retraining is the question | ≥5 / ≥100 per condition | CPU only; 10-minute/5-GiB smoke ceiling; if no filter passes preflight, publish a monitor-only constraint study, not a filter reproduction |
| 20 h, A | Image Push-T author profile plus one perturbation after the unchanged result | PyMunk | 5 | ≥10 / ≥200 per retained condition | Declared GPU budget from pilot; stop at ceiling, preserve partial result |
| 20 h, B | CPU artifact plus time-optimal/geometric-control comparator and required second-simulator check | PyBullet primary; Gazebo second | 5 only if a policy is retrained | ≥10 / ≥200 per condition | CPU primary; GPU optional and separately budgeted |
| 20 h, C | CPU artifact with CBF/predictive-filter comparison and second-simulator check | PyBullet primary; Gazebo or MuJoCo second | 5 only if a policy is retrained | ≥10 / ≥200 per condition | CPU primary; no paid compute unless protocol names it |

### 11.6 The experimental standard

Pre-register the primary metric and safety constraints before looking at final results.

| Layer | Primary metrics | Required secondary evidence |
|---|---|---|
| Control | position/attitude RMSE, integrated absolute error, overshoot, settling time | control effort, saturation time, energy, disturbance-recovery time |
| Estimation/SLAM | absolute and relative trajectory error, bias error, drift per minute | NEES/NIS calibration, innovation whiteness, lost-track rate, relocalisation time |
| Navigation | success rate and SPL | collision rate, path length, time, p95/p99 planning and command latency |
| Manipulation | closed-loop task success, final pose error | peak contact force, drop rate, completion time, interventions, energy |
| Aerial | mission success, cross-track RMSE, maximum excursion | attitude error, saturation, geofence violations, failsafe trigger and recovery latency, energy |
| Learning | held-out closed-loop success; robustness area-under-curve over shift severity | ≥3 stochastic training seeds in the 10 h plan or ≥5 in the 20 h plan; inference latency, data/compute budget, calibration or OOD score, failure taxonomy |
| Reproducibility | an independent rerun reaches the same conclusion and interval | exact environment, assets, seeds, configs, raw logs, checksums, evaluation script, licence record |

Report 95% intervals for proportions and across-seed uncertainty, not only means. For a zero-observed safety event under IID Bernoulli trials drawn from one fixed distribution, report the trial count and the one-sided 95% exact binomial upper limit `1 − 0.05^(1/N)`, approximately `3/N` ([Hanley & Lippman-Hand, JAMA 1983](https://doi.org/10.1001/jama.1983.03330370053031); [NIST e-Handbook §7.2.4.1](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm)). Thus 300 clean trials bound failure probability only near 1% on the frozen simulated test distribution. Correlated trials, shared-mode failures, and incomplete scenario coverage invalidate broader interpretation. This is evidence, not certification.

**Minimum baselines:** no-sophistication (open loop, hold-last-value, straight line, random); classical competent baseline (PID/LQR/MPC, EKF, A*/Nav2, stock PX4 controller, scripted grasp); published learning baseline; oracle upper bound (privileged state, no latency); resource-matched baseline.

**Required ablations and disturbances:** remove each sensor family; nominal-only versus broad-uniform versus a prespecified targeted **synthetic** distribution before hardware; use a measured distribution only at Rung 8 or when an exact public hardware-log dataset is named; recovery monitor on/off; measured simulated latency and jitter; mass, inertia, friction, motor constant, battery voltage, saturation; exposure, blur, lighting, depth dropout, lidar noise, IMU bias, GPS dropout (simulated only, never radiating); timestamp offset, QoS mismatch, packet loss, CPU contention, real-time-factor collapse; interpolation versus held-out extrapolation. Change one mechanism at a time.

**Reproducibility package:** versioned source and commit, dependency lock, OS/container digest, driver/CUDA versions, licences; simulator version, timestep, solver, render settings, asset provenance and checksums; ROS distribution/RMW, QoS, frame tree, clock source, launch snapshots; autopilot firmware tag, parameter export, airframe model, ULog and message schema versions; seeds, randomisation distributions, calibration and system-identification data, split hashes; raw bags/MCAP/ULog, tidy result tables, evaluation scripts, figures generated from tables, machine-readable failure taxonomy; hardware BOM and serials, calibration procedure, battery and thermal state, synchronized video, interventions; model/data card; a clean-environment reproduction guide with a CPU-only smoke test.

---

## 12. Project ladder, hardware gates, and dated budgets

### 12.1 Purchase rule

**[JUDGMENT, high confidence]** Buy hardware only after the simulator exposes a hardware-only unknown: sensor bias, timing, rolling shutter, multipath, slip, backlash, compliance, contact; actuator saturation, motor variation, battery sag, thermal throttling, radio loss, deadline misses; calibration repeatability, connector failures, operator error, emergency-stop procedure; or a sim-to-real claim that a second simulator, held-out scene, SIL, or HIL cannot answer. Never buy hardware to learn kinematics, PID/LQR, ROS topics, planning, elementary RL, mission logic, or experiment design.

### 12.2 Nine rungs

Numerical thresholds are proposed acceptance gates to freeze before the held-out run, not universal truths. Project hours below are **only B implementation + E experiment hours**; course, paper, writing, community, and buffer hours are separate. The rungs are overlapping work packages with sequential acceptance, as defined and mapped cell-by-cell in §15.4; the track-specific R4–R6 artifacts are in §14.2.

| Rung | 10 h plan B/E | 20 h plan B/E | Scope rule |
|---|---:|---:|---|
| 0 | 12/3 | 20/5 | Mandatory both |
| 1 | 35/20 | 55/35 | Mandatory both |
| 2 | 30/25 | 50/45 | Mandatory both |
| 3 | 45/30 | 80/60 | Mandatory both; 20 h absorbs Q3 track-neutral integration preparation |
| 4 | 45/45 | 55/85 | One track-specific closed-loop pilot after the month-9 choice |
| 5 | 30/45 | 60/90 | One track-specific reproduction |
| 6 | 21/81 | 50/135 | Simulation-only; second simulator only in 20 h |
| 7 | 0/0 | 20/40 | 20 h only; replace with software validation if hardware unavailable |
| 8 | 0/0 | 10/50 | 20 h only; replace with external rerun/second simulator if hardware unavailable |
| **Totals** | **218/249 = 467 h** | **400/545 = 945 h** | Exactly equals §15.3 B/E totals |


| Rung | Objective and prerequisites | Stack; hours; cost | Artifact | Acceptance gate | Baselines | Ablations and disturbances | Failure analysis and stop gate |
|---|---|---|---|---|---|---|---|
| **0** Reproducibility diagnostic | Prove an experiment can be repeated; Linux, Python, basic statistics | Ubuntu 24.04, Python 3.12, MuJoCo 3.16.0; **15 h (10 h plan) / 25 h (20 h plan)**; USD 0 | Environment manifest, fixed-seed rollout, raw table, one figure, one-page discrepancy log | 20 same-machine reruns give identical discrete outcomes and continuous metrics within a declared tolerance; clean-environment smoke test passes | Unpinned versus pinned environment | Seed; CPU thread count | Explain nondeterminism; no purchase |
| **1** Dynamics and feedback control | Derive and implement kinematics/dynamics, PID and LQR on one bounded plant: pendulum/cart-pole, simple arm, or planar aerial attitude model | MuJoCo; **55 h / 90 h**; USD 0 | Derivation note, controller configs, trajectory logs, stability discussion | ≥95% stabilisation on held-out initial states; pre-registered RMSE and saturation limits; overshoot, settling time, effort reported | Open loop, PID, LQR; MPC only after these | ±20% mass/inertia, friction, impulse, saturation, timestep | Classify modelling, discretisation, tuning, controllability failures; no hardware |
| **2** State estimation and sensor timing | Fuse IMU with position/range; observability, bias, time alignment, consistency | MuJoCo truth + ROS-independent estimator; **55 h / 95 h**; USD 0 | Noise model, calibration plots, trajectory-error and NEES/NIS tables, dropout replay | ≥30% ATE reduction over dead reckoning on a frozen suite; consistency coverage inside a declared band; no truth in the deployable estimator | Dead reckoning, complementary filter, EKF; oracle state | Bias random walk, 20–200 ms timestamp offset, 1–10% packet loss, 1–5 s dropout | Separate divergence, bad covariance, frame errors, stale timestamps; no sensor purchase yet |
| **3** ROS 2 integration and mobile planning | Transforms, clocks, QoS, lifecycle nodes, rosbag replay, mapping, planning | ROS 2 Jazzy + Gazebo Harmonic + Nav2 on a simulated TurtleBot-class base; **75 h / 140 h**; USD 0 | Frame/QoS diagram, 100-seed navigation suite, bags, latency profile, failure labels | ≥95/100 nominal successes; zero nominal collisions; p99 command latency under the control deadline; SPL ≥10% above the naive baseline where obstacles make it meaningful | Stock Nav2; A* with simple tracker; naive reactive | Map inflation, wheel slip, lidar dropout, dynamic obstacle, CPU load, timestamp skew, QoS setting | Classify localisation, planning, control, middleware, simulation failures |
| **4** Track-specific closed-loop integration | Integrate perception/state, decision logic, controller, logging, reset, safety-state semantics, and one disturbance harness without hardware; exact A/B/C substitution in §14.2 | A: MuJoCo manipulation task; B: PX4 v1.17.0 + Gazebo Harmonic x500 + QGC v5.1.5; C: MuJoCo/Gazebo assurance case; **90 h / 140 h**; USD 0 | Frozen nominal/disturbance suite, complete logs, automated result table, state/safety diagram | Illustrative common gate: ≥95% nominal task success over 100 fixed cases, zero unreported boundary events, p99 command latency below deadline, and predefined safe stop/abort in ≥99/100 critical disturbances; track table narrows the metric | Track A scripted or BC policy; B stock PX4 controller; C unmonitored nominal controller | A: visual/contact shift; B: wind/GPS/barometer/link; C: model error, latency, packet loss, constraint width | Verify state transitions and failures from logs, not video; no physical flight or powered robot. Rung 4 acceptance closes in Q6 on the 10 h plan and Q5 on the 20 h plan (§15.4) |
| **5** Track-specific public-artifact study | Run one public artifact unchanged before modification; B/C use the `safe-control-gym` `v1.0.0` profile, whose recorded result is a single-machine smoke observation with a partial manifest, while Diffusion Policy is optional Track A only | Isolated profile from §11.5; **75 h / 150 h**; USD 0 software; Track-A accelerator cost not established | Unchanged run, exact identity/checksums/environment/deviations, raw metrics, compute/storage, paper-result mapping, then one predeclared perturbation | B/C: first rerun the checkpoint and report its observed metrics without treating them as an expected signature; then either (a) run all Figure-5 controller conditions under a matched absolute-error protocol, using Figure-6 x/z RMSE only where applicable, (b) label a subset `partial reproduction`, or (c) label one checkpoint `checkpoint evaluation, not paper reproduction`; explain a discrepancy with ≥3 tested causes | B/C: published Figure-5 conditions as available (LQR, mismatched LQR, GP-MPC, PPO, SAC); PID/CBF/safety-filter runs labeled extensions; A: author Diffusion Policy plus BC under matched data after its pilot | Observation/sensor group, disturbance, action rate, latency; no cross-simulator requirement in the 10 h plan | Separate install failure, implementation mismatch, variance, unavailable artifact, and scientific discrepancy. Never cite the README's random-action throughput table as PPO performance; a MuJoCo/CPU Diffusion Policy port is an adaptation |
| **6** Simulation-only robustness and recovery benchmark | Test whether explicit recovery and a prespecified **synthetic** parameter/visual-shift distribution improve held-out robustness over nominal and broad-uniform training; no hardware-derived claim is allowed | Primary simulator only in the 10 h plan; a second simulator is required and budgeted in the 20 h extension; **102 h / 185 h**; software USD 0, compute declared | Benchmark specification, frozen train/validation/test shift distributions, preregistered analysis, intervals, negative results, §11.6 package | Meaningful held-out effect or useful null result; external protocol review before any HIL/hardware. No claim about sim-to-hardware calibration | Nominal; broad uniform; targeted synthetic distribution; targeted + recovery. Follow §11.5 seeds/episodes | Each parameter family; recovery monitor; OOD score; equal data/compute; 20 h only: simulator-to-simulator rank check | Primary: robustness AUC and safety-constrained success. Call all distributions simulated; move measured system identification and sim-to-hardware error to Rung 8 |
| **7** HIL and edge-compute gate, no propellers | Timing, transport, thermal, power, failsafe properties simulation cannot establish; **20 h plan only** | Target edge computer or autopilot in HIL/bench mode with actuators disabled; **60 h**; buy or borrow only the justified component | p50/p95/p99 latency, jitter, drop rate, 30–60 min thermal/power trace, link-loss recovery, wiring and hazard review | p99 pipeline latency < 50% of control period; no deadline overrun in endurance run; declared packet-loss limit (suggested <0.1%); deterministic safe state after process, link, and power faults | Desktop versus edge; CPU versus accelerator; full versus reduced model; with and without contention | Normal versus CPU/network contention | Stop on thermal throttling, stale commands, unsafe re-arm, unbounded output; HIL is not airworthiness |
| **8** Contained hardware validation and paper | One pre-registered hardware-only question; submit for external review; **20 h plan only and replace with independent simulation validation when hardware is unavailable** | Stationary tabletop arm or slow mobile base preferred; a microdrone only in a purpose-built indoor net with a supervisor after §13; larger aircraft only through a qualified lab; **60 h plus separately approved procurement** | ≥20–30 hardware trials per principal condition paired with matched simulated trials; aborted/intervened trial accounting; intervals; telemetry-aligned video; paper or technical report with anonymous artifact, model card, safety and legal appendix, limitations, negative results | Hardware success lower bound no more than 10 percentage points below matched simulation; selected NRMSE ≤20%; no safety-boundary event; a miss means update the model or narrow the claim | The four Rung 6 cells; simulator-only versus measured system ID | Recovery removed; sensor/latency components removed | Identify simulator parameters on one hardware dataset, freeze, evaluate on different objects/routes/batteries/days; never tune and report on the same trials |

### 12.3 Sim-to-hardware release criteria

All applicable gates before powered motion: (1) frozen test suite with no tuning on final seeds; (2) independent safety monitor on speed, position, attitude, force, and command age with tested hold/stop/land; (3) measured p99 latency below half the control period including sensing, transport, inference, and actuation; (4) measured hardware parameter ranges inside the simulation envelope; (5) under IID Bernoulli trials from the frozen simulated test distribution, at least 300 zero-violation trials before even a one-sided 95% bound near 1%, using the exact limit `1 − 0.05^(1/N)` (approximately `3/N`; [Hanley & Lippman-Hand, JAMA 1983](https://doi.org/10.1001/jama.1983.03330370053031); [NIST e-Handbook §7.2.4.1](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm)); correlated trials, shared-mode failures, and incomplete scenario coverage prevent a broader claim, and this is evidence, not certification; (6) independent logs of commanded and measured state, watchdog, interventions, battery and thermal state, synchronized video; (7) physical progression power-off → actuators disconnected or propellers off → restrained low-energy motion → guarded or caged test → approved envelope; (8) trained second person, exclusion zone, kill switch, fire plan, property permission, current legal and airspace review; (9) stop on unexpected arming, stale-command motion, guard breach, flyaway tendency, battery damage, repeated estimator divergence, or unexplained timing overrun.

### 12.4 Hardware and sensor options (single-vendor foreign snapshots, 20 October 2026; **not procurement evidence**)

| Option | Observed vendor statement/status | Uniquely teaches | Do not buy when |
|---|---|---|---|
| Crazyflie 2.1+ STEM drone bundle | **[UNCERTAIN: vendor-stated foreign price]** USD 320; Bitcraze says it includes Crazyflie 2.1+, Crazyradio 2.0, and Flow deck v2, and says the aircraft is 29 g ([bundle](https://store.bitcraze.io/products/stem-drone-bundle); [aircraft](https://store.bitcraze.io/products/crazyflie-2-1-plus)). No independent price/technical source or Indian landed quote was verified. | Optical-flow and range failure, motor variation, battery sag, radio loss, host latency, ground effect, micro-scale flight procedure | The goal is PX4 validation, outdoor autonomy, or learning basic flight control |
| TurtleBot3 Burger RPi4 4 GB | **[UNCERTAIN: vendor-stated foreign price]** USD 783.50 on the ROBOTIS US page; the same vendor's e-manual describes ROS 2 Humble/Jazzy, Gazebo, lidar, SLAM, and navigation ([product](https://robotis.us/products/turtlebot-3-burger-rpi4-4gb-us); [manual](https://emanual.robotis.com/docs/en/platform/turtlebot3/overview/)). No independent price/technical source or Indian landed quote was verified. | Wheel slip, floor transitions, odometry bias, network delay, relocalisation, power faults | The simulated navigation suite has not passed, or the question is manipulation |
| OpenMANIPULATOR-X | **[UNCERTAIN: vendor-stated foreign price]** USD 1,629.09 on the ROBOTIS US page; the same vendor's manual describes the platform ([product](https://robotis.us/products/openmanipulator-x-rm-x52-tnm); [manual](https://emanual.robotis.com/docs/en/platform/openmanipulator_x/overview/)). No independent price/technical source or Indian landed quote was verified. | Backlash, compliance, servo heating, grasp contact, camera–robot calibration, human reset bias | Only kinematics/planning is needed, or no guarded tabletop and e-stop exist |
| SO-101 / LeRobot-class DIY arm | **[UNCERTAIN]** six servos per arm per the [current guide](https://huggingface.co/docs/lerobot/so101); no authoritative complete-system price established | Low-cost imitation data collection, leader/follower calibration, assembly variability | A turnkey, safety-documented platform is required |
| Jetson Orin Nano Super Developer Kit | **[FACT: vendor-stated specification; UNCERTAIN price]** NVIDIA states 67 INT8 TOPS, 8 GB LPDDR5, and 7–25 W; a NVIDIA announcement states USD 249, while the current product page had no live checkout ([specification](https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/); [announcement](https://developer.nvidia.com/blog/nvidia-jetson-orin-nano-developer-kit-gets-a-super-boost/)). No independent technical/price source or Indian quote was verified. | Target inference latency, memory pressure, thermal throttling, power modes | Desktop profiling has not shown a target-compute bottleneck |
| Luxonis OAK-D Lite | **[UNCERTAIN: vendor-stated foreign price; FACT about vendor documentation]** USD 269 on the Luxonis store; Luxonis states stereo depth, RGB, IMU, onboard processing, and Humble/Jazzy ROS support ([product](https://shop.luxonis.com/products/oak-d-lite-1); [ROS docs](https://docs.luxonis.com/software/ros/depthai-ros/)). No independent price/technical source or Indian landed quote was verified. | Intrinsic/extrinsic/time calibration, exposure, stereo failure, depth holes, USB bandwidth | RGB-D is not part of the hypothesis |

**Sensor order:** perfect simulated state → realistic simulated noise and dropout → existing webcam/IMU/lidar → one sensor chosen by the hypothesis. Borrow lab-grade sensing before buying it.

**Safety engineering (separate from law):** arms and mobile robots need a physical e-stop independent of the research process, current/velocity/force limits, a guarded envelope, and intervention logs; microdrones need a full net, prop guards where compatible, eye protection, one operator and one observer, a tested kill/disarm, and no autonomous first flight; batteries need an approved charger, fire-resistant surface, attended charging, inspection for swelling or damage, and proper disposal; software needs a watchdog that rejects stale or future timestamps, bounded outputs, disarmed restart defaults, and an emergency path independent of ROS, Wi-Fi, and the learned policy.

### 12.5 Four dated budget scenarios

FX: **USD 1 ≈ INR 94.9255** (ECB, 20 October 2026; see §0). Totals are converted from the USD subtotal before rounding, so summed rows can differ by ₹1. Excluded: card spread, GST, customs, brokerage, shipping, hazardous-battery shipping, warranty, FX movement. A manufacturer USD price is not an Indian landed price; drone imports may need DGFT authorisation (§13).

**A. Existing computer, software-only — USD 0 / ₹0 incremental hardware.** ROS 2, Gazebo, MuJoCo, PX4, QGroundControl, `safe-control-gym`, and PyTorch are available without licence fees in the cited routes, although electricity, internet, depreciation, and optional cloud compute are not priced. The §11.5 `safe-control-gym` checkpoint command produced one **single-machine smoke observation with a partial manifest**; that result does not establish every operating system, the full paper comparator, or training cost. Diffusion Policy's Track-A author run is excluded unless existing or institutional GPU access or a written cloud ceiling is declared. Purchase gate: no hardware before Rung 6.

**B. Contained microdrone illustration — single-vendor foreign arithmetic only; not orderable and not an Indian procurement budget.** Vendor-stated foreign goods add to **USD 337**; the dated FX conversion is **₹31,990 for comparison only**, while **landed INR cost is not established**. Adding unquoted safety allowances gives illustrative arithmetic of USD 437 / ₹41,482, still not an orderable total.

| Item | Mandatory | Evidence/status (20 October 2026) | USD | ≈ INR |
|---|---|---|---:|---:|
| Crazyflie STEM bundle | Yes, if this scenario is ever approved | [Bitcraze vendor-stated foreign price](https://store.bitcraze.io/products/stem-drone-bundle); no independent Indian seller/stock/landed quote | 320.00 | 30,376 |
| Spare battery with USB charger | Yes | [Bitcraze vendor-stated foreign price](https://store.bitcraze.io/products/250mah-lipo-battery-including-500ma-usb-charger); uncorroborated | 10.50 | 997 |
| Spare propeller pack | Yes | [Bitcraze vendor-stated foreign price](https://store.bitcraze.io/products/propeller-pack); uncorroborated | 6.50 | 617 |
| Full net/cage | Yes | Planning allowance, **not a quote** | 50.00 | 4,746 |
| Eye protection and exclusion markings | Yes | Planning allowance, **not a quote** | 10.00 | 949 |
| LiPo charging/fire-resistant storage controls | Yes | Planning allowance, **not a quote** | 20.00 | 1,899 |
| Landing mat, consumables, small spares | Yes | Planning allowance, **not a quote** | 10.00 | 949 |
| Allowance contingency | Yes | Planning allowance, **not a quote** | 10.00 | 949 |
| **Foreign goods subtotal / planning total** | | Landed cost, GST/customs/brokerage/shipping and availability **not established** | **337.00 / 437.00** | **31,990 / 41,482** |

**Order status [UNCERTAIN]: NOT ORDERABLE UNDER THIS ROADMAP.** No authorized Indian stock source, written shipping quote, product-specific DGFT decision, or Crazyradio WPC/DoT status was verified. It becomes a candidate only after Rung 6, a cage/supervisor, and written product-specific confirmations. No verified domestic substitute with equivalent research capability was found in the evidence window; use Scenario A or institutional equipment rather than a marketplace guess.

**C. Larger individual-hardware illustration, choose one embodiment — single-vendor foreign arithmetic plus unquoted controls; NOT ORDERABLE.** No independent technical/price source, authorized Indian availability, written landed quote, GST/customs/brokerage treatment, or warranty route was verified. The mathematical INR conversions help compare scale only; **landed INR cost is not established**.

| Line item | Status | Mobile USD | Manipulation USD |
|---|---|---:|---:|
| [TurtleBot3 Burger](https://robotis.us/products/turtlebot-3-burger-rpi4-4gb-us) / [OpenMANIPULATOR-X](https://robotis.us/products/openmanipulator-x-rm-x52-tnm) | Uncorroborated vendor-stated foreign price; choose one | 783.50 | 1,629.09 |
| [OAK-D Lite](https://shop.luxonis.com/products/oak-d-lite-1) | Uncorroborated vendor-stated foreign price; optional unless depth is causal | 269.00 | 269.00 |
| Independent power isolation/e-stop | Mandatory planning allowance, not quote | 60.00 | 60.00 |
| Guard/containment, secure base, exclusion markings | Mandatory planning allowance, not quote | 50.00 | 50.00 |
| Calibration target and fixtures | Mandatory planning allowance, not quote | 20.00 | 20.00 |
| Wear parts and consumables | Mandatory planning allowance, not quote | 40.00 | 40.00 |
| Charging/fire-safe energy controls | Mandatory planning allowance, not quote | 15.00 | 15.00 |
| Safety contingency | Mandatory planning allowance, not quote | 15.00 | 15.00 |
| **Vendor-stated foreign goods / illustrative arithmetic** | Not orderable; landed INR, GST/customs/shipping/brokerage/stock not established | **1,052.50 / 1,252.50** | **1,898.09 / 2,098.09** |
| **FX-converted illustrative total** | Mathematical comparison only; landed INR is `not established` | **₹118,894** | **₹199,162** |

Optional Jetson: NVIDIA's announcement was USD 249, but no current Indian checkout or independent price was verified; adding it yields illustrative arithmetic of USD 1,501.50 (₹142,531 by FX only) mobile or USD 2,347.09 (₹222,799 by FX only) manipulation. **Order status [UNCERTAIN]: NOT ORDERABLE UNDER THIS ROADMAP** until §12.6 is complete. Omit OAK-D or Jetson unless the protocol makes depth or target latency causal. Prefer Scenario D when maintenance, containment, calibration, or supervision is not already available.

**D. Lab-grade access instead of purchase — planning cap USD 2,000 ≈ ₹189,851 per year:** access contribution or fees USD 1,000 (₹94,926); travel and supervised test days USD 500 (₹47,463); consumables, calibration targets, batteries, end effectors, props USD 300 (₹28,478); contingency USD 200 (₹18,985). These are caps, not quotations; institutional access may be free, subsidised, or unavailable. Lab-grade arms, motion capture, RTK or event cameras, enclosures, and service contracts are quote-only and need trained staff; obtain written quotes and compare total ownership against the access envelope.

### 12.6 India procurement execution gate

Before any order, create a one-page purchase record with: exact manufacturer part/SKU and radio module; two written quotes where possible, including one authorized Indian channel; stock date; GST invoice status; shipping, battery restrictions, customs classification/duty/brokerage; warranty/returns; DGFT written position for any imported UAS; DoT/WPC equipment-authorization, licence and import position for the exact transmitter; mandatory containment, independent stop, charging/fire controls, calibration, wear parts and two failure spares; host-compute compatibility; and the Rung-6 result that the purchase will test. Any unresolved mandatory field means **do not order**. A marketplace listing, foreign CE/FCC mark, or payment acceptance is not clearance.

---

## 13. Indian drone rules and responsible operation

> **[FACT]** This section reads official public material. It is **not legal advice or flight authorisation**. The principal Drone Rules instrument is from 2021 and the latest amendment located is from 2023; no later Drone Rules amendment was found in the Ministry's current list/archive on 20 October 2026, which is a dated negative finding, not a guarantee. The parent **Bharatiya Vayuyan Adhiniyam, 2024 has been in force since 1 January 2025**. Digital-personal-data law is phased and mission-specific; a camera-equipped project must perform a separate data review. Recheck immediately before purchase, import, radio use, registration, data capture, or flight.

### 13.1 Controlling and official instruments checked

| Instrument or source | Date/status | What it establishes |
|---|---|---|
| [Drone Rules, 2021, G.S.R. 589(E), Gazette PDF](https://egazette.gov.in/WriteReadData/2021/229221.pdf) | Notified 25 August 2021; rule 1 commences on publication | Classification, certification, registration, airspace, pilot, R&D, insurance, safety, and enforcement framework |
| [Drone (Amendment) Rules, 2022, G.S.R. 108(E)](https://www.civilaviation.gov.in/sites/default/files/2025-11/drone-amendment-rules-2022-dated-11-feb-2022.pdf) | 11 February 2022 | Replaces "remote pilot licence" with "remote pilot certificate", removes the second DGCA licence-issuance step, changes renewal wording and the legacy-registration deadline (OCR quality poor; claims limited to legible operative text) |
| [Drone (Amendment) Rules, 2023, G.S.R. 715(E)](https://www.civilaviation.gov.in/sites/default/files/2024-04/Drone%20%28Amendment%29%20Rules%2C%202023.pdf) | Notified 27 September 2023; Gazette 3 October 2023 | Form D-4 may use an Indian passport or government-issued identity plus address proof |
| [Ministry of Civil Aviation current rules list](https://www.civilaviation.gov.in/ministry-documents/rules) and [archive](https://www.civilaviation.gov.in/index.php/ministry-documents/rules/archive-document) | Accessed 20 October 2026 | No Drone Rules amendment later than 2023 located; the archive indexes the 2023 PDF twice by listing date; the Gazette instrument controls |
| [Government-hosted consolidation of the 2021 Rules with the 2023 amendment](https://indiacinehub.gov.in/sites/default/files/2024-04/drone_rules_2021_with_2023_amendment_1.pdf) | Uploaded 25 April 2024 | Cross-check only; Gazette instruments control |
| [Bharatiya Vayuyan Adhiniyam, 2024 (Act 16 of 2024)](https://www.civilaviation.gov.in/themes/moca/img/Files/bharatiya-vayuyan-adhiniyam-2024-2_0.pdf); [commencement notification S.O. 5646(E)](https://egazette.gov.in/WriteReadData/2024/259757.pdf) | Act assented/Gazetted 11 December 2024; S.O. 5646(E) dated 31 December 2024 appointed **1 January 2025** for commencement | Replaced the Aircraft Act, 1934. Section 43 repeals that Act and saves prior rules, appointments, certificates, actions and instruments insofar as consistent. The [Ministry's current performance page, accessed 20 October 2026](https://www.civilaviation.gov.in/our-performance) independently states the same commencement/replacement transition |
| [Digital Personal Data Protection Act, 2023 (Act 22 of 2023), India Code](https://indiacode.gov.in/act/c058fa9f-eaf0-4ca3-98f1-3443b087bca9/sections); [commencement G.S.R. 843(E), 13 November 2025](https://egazette.gov.in/WriteReadData/2025/267647.pdf) | Act dated 11 August 2023. Under G.S.R. 843(E), §1(2), §2, §§18–26, §§35, 38–43 and §44(1),(3) began on Gazette publication; §6(9) and §27(1)(d) were scheduled one year later (**13 November 2026**, future at cutoff); the listed substantive processing provisions, including §§3–17, were scheduled 18 months later (**13 May 2027**, future at cutoff) | Establishes that only specified institutional/definition provisions were in force at the cutoff; the report's data-minimization protocol is conservative policy, not a claim that future substantive duties had already commenced |
| [Digital Personal Data Protection Rules, 2025, G.S.R. 846(E), Gazette](https://egazette.gov.in/WriteReadData/2025/267650.pdf); [India Code record](https://indiacode.gov.in/items/fe07b131-481d-4cc9-bdb5-7bd218ced646); [MeitY rules page](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025) | Notification dated 13 November 2025: rules 1, 2 and 17–21 began on publication; rule 4 was scheduled for **13 November 2026**; rules 3, 5–16, 22 and 23 for **13 May 2027**. The latter dates were future at this cutoff. MeitY listed a corrigendum dated 16 December 2025 | Exact phased rule status. Do not present future notice, consent, security, breach, child-data, or other provisions as already operative solely from this instrument; still use conservative privacy/ethics controls and recheck at collection time |
| [AAI Digital Sky portal](https://digitalsky.aai.aero/) and [public airspace map](https://digitalsky.aai.aero/digital-sky-map) | Portal build displayed 15 October 2026; accessed 20 October 2026 | Live zones, map, flight-plan services; homepage says D-1 to D-5 applications moved to eGCA. **[UNCERTAIN]** The old DGCA-hosted Digital Sky address behaved inconsistently in two checks (one saw a redirect to the AAI portal; another saw an expired TLS certificate). Use the AAI address and do not bypass certificate warnings |
| [AAI Aeronautical Information Management](https://aim-india.aai.aero/) and [NOTAM summaries](https://aim-india.aai.aero/notam-summaries) | Accessed 20 October 2026 | AIP, supplements, AIC, NOTAM and pre-flight material; AIP AMDT 09/2026 effective 1 October 2026; AMDT 10/2026 listed as effective **29 October 2026**, which was future material on the report date and is not treated as effective |

### 13.2 What the Rules say, and the practical reading

| Topic | Regulation (paraphrased) | Practical reading **[JUDGMENT]** |
|---|---|---|
| Scope and "indoors" | Rule 2 applies to persons owning, possessing, leasing, operating, transferring, or maintaining UAS in India and to UAS operated in or over India; Union naval, military, and air-force UAS excluded. | No blanket indoor, educational, or hobbyist exclusion appears in the checked text. A cage reduces risk; it does not create an exemption. Ask DGCA or counsel when an indoor case is consequential. |
| Weight classes | Rule 5: nano ≤250 g; micro >250 g to 2 kg; small >2 kg to 25 kg; medium >25 kg to 150 kg; large >150 kg (all-up weight including payload). | A 29 g Crazyflie is nano by weight, but class alone does not erase other rules; recompute after every deck, guard, battery, and payload. |
| Model RPAS | Rule 3 defines a model remotely piloted aircraft system as remotely piloted, all-up weight ≤25 kg, used only for education, research, design, testing, or recreation, and flown within visual line of sight. | "Research" is not a universal waiver; model status brings the rule-13 type-certificate exemption, nothing more by itself. |
| Type certificate | Rule 6 requires conformity to a type certificate unless exempt; rule 13 exempts manufacturing/importing from type certification and exempts operation of model RPAS and nano UAS. | The exemption is from type certification, not from registration/UIN, pilot certification, airspace rules, safe operation, or insurance. |
| Registration / UIN | Rule 14 requires Digital Sky registration and a UIN before operation unless another exemption applies; rule 15 defines the D-2 process; rule 42 gives a limited R&D-entity exemption. | The checked text has no general nano/model UIN exemption; do not copy the type-certificate exemption into the registration column. The portal says D-1 to D-5 services moved to eGCA; verify the live process. |
| Remote pilot certificate | Rules 31–36 as amended in 2022 require a category/class-specific remote pilot certificate; rule 36 exempts nano operation and non-commercial micro operation. | Crazyflie nano operation is certificate-exempt; a >2 kg educational model aircraft is not exempt merely because it is a model. |
| R&D exemption | Rule 42 exempts type certificate, UIN, prior permission, and remote pilot certificate for listed entities (government-controlled or recognised R&D entities and educational institutions, DPIIT-recognised startups, authorised testing entities, GST-registered UAS manufacturers) operating in a green zone on their own premises or an open green-zone area under their control. | An individual cannot self-label a project "research" and assume rule 42; obtain documentary evidence for every element. It does not waive safe operation, insurance, import, radio, privacy/property, or other law. |
| Airspace zones | Rule 3: green zone is generally up to 400 ft (120 m) where not red or yellow, and up to 200 ft (60 m) in the 8–12 km band from an operational airport; yellow needs the concerned ATC authority's permission; red needs Central Government permission. | 120 m is not a universal entitlement; the live map, temporary zones, site limits, AIP/NOTAM, and permissions control. |
| Pre-flight check | Rule 21 requires checking Digital Sky before every operation; rule 22 requires prior permission in red/yellow and none in green subject to rule 21; rule 23 allows map changes; rule 24 allows temporary red zones for up to 96 hours at a time. | Open the live map immediately before flight at the actual coordinates, altitude, and time; keep dated evidence; an old screenshot proves nothing. |
| Safe operation, right of way, accidents | Rule 26 prohibits operation that directly or indirectly endangers people or property; rule 29 requires remaining clear of manned aircraft; rule 30 requires reporting an accident through Digital Sky within 48 hours. | Outcome duties, not checklists; preserve telemetry after an accident and verify the current reporting route. |
| Insurance | Rule 44 applies Motor Vehicles Act concepts *mutatis mutandis* to third-party UAS insurance; nano may operate without third-party insurance. | Certificate exemption and insurance exemption are different things; insure non-nano hardware and confirm scope for autonomous use. |
| Import | Rule 11 assigns UAS import regulation to DGFT or another authorised Central Government entity. | **[UNCERTAIN]** A complete current ITC(HS) import position was not established from an accessible consolidated official instrument. Check the [DGFT notification portal](https://www.dgft.gov.in/CP/?opt=notification) and obtain written guidance before ordering any aircraft or radio from abroad; a store accepting payment is not authorisation. |
| Radio | The Drone Rules do not establish equipment or spectrum approval; radio apparatus can engage separate Department of Telecommunications/WPC requirements. | **[UNCERTAIN]** Check the [DoT eServices portal](https://eservices.dot.gov.in/) for the exact module, band, power, and import route; do not infer compliance from "2.4 GHz" or CE/FCC marks. Unresolved for the Crazyradio at the cutoff. |
| Privacy and imagery data | G.S.R. 843(E) brought DPDP Act definitions and institutional provisions into force on publication, while most substantive processing provisions were scheduled for 13 May 2027; G.S.R. 846(E) phased the Rules similarly. At the cutoff, do not describe future duties as operative. Other current privacy, confidentiality, property, contract, sectoral, and institutional duties may still apply; aviation compliance settles none of them. | **Conservative internal policy, not a statement of then-operative DPDP duties:** avoid uninvolved people/property; minimize field of view/location metadata; obtain site/participant authorization; encrypt access; set retention/deletion; prohibit face recognition or surveillance scope creep; document cloud processors and release rights. Recheck law on collection day and seek Indian counsel for public-space, commercial, people-facing, or sensitive-location work. |
| Enforcement | Rules 50 and 53 provide monetary penalties and cancellation/suspension; the Bharatiya Vayuyan Adhiniyam has governed the parent statutory framework since 1 January 2025, while §43 preserves compatible prior rules/actions. | Do not rely on an old maximum-penalty summary; verify the current Act, delegated rules, amendments, and orders with Indian aviation counsel for an enforcement-sensitive decision. |

### 13.3 Before any outdoor operation (official implementation guidance, not a replacement for the Gazette)

1. Open the [AAI Digital Sky map](https://digitalsky.aai.aero/digital-sky-map) at the actual coordinates, altitude, and time; inspect red, temporary-red, airport, and yellow zones.
2. Use the portal's flight-plan process where applicable; DGCA D-1 to D-5 services sit behind the [eGCA login](https://www.dgca.gov.in/digigov-portal/jsp/dgca/common/login.jsp) per the portal homepage.
3. Check the [AAI AIM package](https://aim-india.aai.aero/) for the AIP amendment effective on the flight date, supplements, AIC, NOTAM summaries, and pre-flight information.
4. Check local temporary restrictions, property and site permission, police or administration requirements, weather, people, and obstacles; contact ATC/DGCA/AAI when the map or mission is ambiguous.
5. Recheck after any change of route, payload, aircraft, firmware, pilot, date, altitude, or site. A prior green classification cannot authorise a future operation.

### 13.4 Data-capture gate

**[FACT]** The DPDP Act/Rules are not an aviation permission system and their commencement is phased. **[JUDGMENT]** Use a conservative no-bystander protocol even where a personal/domestic or other statutory boundary might later apply: simulation/synthetic data first; camera pointed only at a controlled target; no face recognition; no recording outside the controlled area; strip precise location/device identifiers before sharing; access-controlled storage; fixed deletion date; written participant/site permission; data and model cards. Stop and obtain qualified Indian advice before public-space imagery, identifiable people, commercial processing, cloud transfer, sensitive sites, or publication of raw geolocated data. This is risk control, not a conclusion that those steps alone satisfy the Act.

### 13.5 Internal safety policy (stricter than the legal maximum)

Simulation, SIL, and HIL first; no novice outdoor flight; nothing over or near uninvolved people, traffic, animals, power lines, buildings, airports, emergency activity, or sensitive sites; daylight, visual contact, conservative weather, and a sterile launch area unless an institution approves otherwise; no payload release, surveillance, RF interference, weapons, dangerous goods, or experiments that degrade real navigation or communications; a written go/no-go checklist, observer, kill procedure, lost-link action, battery limit, abort boundary, and post-flight log review; prefer a stationary arm, a mobile base, or a netted 29 g microdrone; access larger aircraft only through an institution with legal, insurance, pilot, site, and maintenance support.

### 13.6 Monitoring the law (monthly, inside the §17 budget)

[DGCA portal](https://www.dgca.gov.in/digigov-portal/) "What's New" and RPAS/UAS material; [Ministry of Civil Aviation rules](https://www.civilaviation.gov.in/ministry-documents/rules) searched for `drone`, `unmanned aircraft`, `remote pilot`, `Digital Sky`, `type certificate`; [eGazette](https://egazette.gov.in/) (the old `egazette.nic.in` hostname failed DNS); AAI Digital Sky and AIM. Record the exact document, number, and date, not the home page. Quarterly comparators, not authorities: [FAA UAS](https://www.faa.gov/uas), [EASA Drones & Air Mobility](https://www.easa.europa.eu/en/domains/civil-drones), [ASTM Committee F38](https://www.astm.org/membership-participation/technical-committees/committee-f38), [IEEE RAS Standards](https://www.ieee-ras.org/industry-activities/standards/); ISO/TC 299 and ISO/TC 20/SC 16 and ICAO UAS pages returned HTTP 403 to automated access and need manual checks.

---

## 14. Three specialization tracks and binding decision criteria

### 14.1 Decision point, chronology, and track cards

The **track choice occurs at the end of month 9 (Q3)**. By then the 10 h plan has completed 110 F hours and Rungs 0–2 plus most of Rung 3; the 20 h plan has completed 175 F hours and Rungs 0–2 plus Rung-3 implementation. The remaining 50 F hours in the 10 h plan, 75 F hours in the 20 h plan, Rungs 4–6, one 24-hour reading branch, the public-artifact study, and the thesis are track-specific. This corrects the tempting but false idea that all 160/250 F hours and Rungs 0–4 finish before specialization.

All “6/12/24-month outcomes” below mean **absolute months from roadmap start**, not months since track selection. Month 6 is therefore a common foundation outcome viewed through a provisional interest; month 12 is the first track-specific closed-loop pilot; month 24 is the completed track artifact. **Default [JUDGMENT]: Track B**, because it exercises estimation, control, perception, systems, and evaluation without requiring a GPU, laboratory, aircraft, or flight field.

| Dimension | Track A: embodied robot learning and manipulation | Track B: resilient autonomous aerial robotics (default) | Track C: safe and reliable physical AI, controls, and evaluation |
|---|---|---|---|
| Fit profile | ML/data interest; manipulation focus; willing to debug a legacy GPU artifact; exact GPU pilot passes | Systems, estimation, control, closed-loop debugging; CPU path; no physical flight required | Statistics, optimization, assurance, benchmark validity; accepts a rigorous null or negative result |
| Prerequisite gaps | M6–M8; diffusion/flow basics; contact mechanics RL-32 | Rung 2; RL-18 geometric control; PX4 architecture; M9–M10 | Probability depth; RL-19/20 CBF/MPC; F11 evaluation design |
| Canonical stack | Immutable Diffusion Policy PyMunk/CUDA profile for Rung 5; MuJoCo for the track thesis only when labeled a new adaptation | Jazzy/Harmonic/PX4/QGC for Rung 4 and thesis; §11.5 PyBullet artifact for Rung 5 | MuJoCo/Gazebo constrained-system harness plus §11.5 PyBullet artifact; add a safety filter only after task-support and licence preflight |
| **Month 6 outcome** | Common Rung-1 controller on a simple arm or point-mass manipulation model, with mass/contact-proxy stress test | Common Rung-1 planar attitude/point-mass controller with mass/latency stress test | Common Rung-1 controller with constraint and model-error audit |
| **Month 12 outcome** | Rung-4 simulated manipulation baseline with frozen resets, compact BC/scripted comparator, and one visual/contact shift | Rung-4 PX4 SITL mission/failsafe pilot plus logged visual-landing baseline | Rung-4 constrained-control harness with nominal controller, monitor-off baseline, latency/model-error faults, and violation metric |
| **Month 24 outcome** | Reproducible policy robustness/data-efficiency thesis; optional supervised tabletop validation | Temporal-disagreement landing-gate thesis and archival artifact; hardware optional after Gate H | Calibrated runtime-assurance or benchmark-validity thesis, including a useful null if warranted |
| Mandatory 24 h branch | RL-24, RL-28, RL-29, RL-32, RL-33 | RL-12, RL-13, RL-34, RL-35, RL-36 | RL-3, RL-11, RL-14, RL-20, RL-21 |
| Courses/books | M6–M8 and CS224R extracts; Mason or MIT manipulation on demand | M9–M10; Underactuated; Beard–McLain or Quan on demand | EE364A/M3/Underactuated safety extracts; Barfoot and Kochenderfer on demand |
| Rung-5 artifact | Faithful **image** Push-T only after the immutable GPU pilot; otherwise switch tracks, not tasks | `safe-control-gym` `v1.0.0` 2-D tracking artifact mapped to paper Figures 5–6, with checkpoint-only boundary stated | Same immutable artifact; add a task-compatible CBF/safety-filter comparator only after its command/configuration/licence audit, otherwise study constraint monitoring without claiming a filter reproduction |
| Narrow thesis | Does a calibrated temporal observation/action-disagreement gate reduce failed simulated pushes under visual/object shift without reducing completion by >10 percentage points? | Does a calibrated temporal-disagreement gate cut unsafe simulated landings by ≥30% relative without reducing completion by >10 percentage points? | Does a calibrated runtime monitor cut simulated constraint-violation episodes by ≥30% under model/latency shift without reducing task success by >10 percentage points? |
| Portfolio project | Open-policy perturbation benchmark with degradation curves and failure taxonomy | Visual-landing stress test, risk-coverage curve, and ULog-backed failsafe evidence | Runtime-assurance or cross-simulator ranking benchmark with intervals |
| Access and safety | NVIDIA GPU for author reproduction; no arm until Rung 8; pinch/crush and licence gates | No hardware required; any microdrone only after Gate H and §13; no outdoor flight | No hardware required; preserve intervention costs, nulls, and bounded guarantees |
| Labs/venues to investigate | Berkeley RAIL/BAIR; Stanford ILIAD; UT Austin RPL; MIT; RSS/CoRL/ICRA | UZH RPG; ETH ASL/RSL; TU Delft MAVLab; CMU AirLab; IIIT-H RRC; IIT Kanpur/Bombay; RSS/ICRA/IROS/ICUAS | Schoellig/Zeilinger groups; Stanford ASL; IISc RBCCPS/ARTPARK; CDC/ACC/RSS/CoRL |
| Switch/stop | No successful author-profile pilot by the Q3 choice, no declared compute ceiling, or no closed-loop metric → B or C | No frozen PX4 suite by Q5, or integration consumes >40% of two quarters → C using the same fault logs | No instantiated physical-system case by Q5 → B landing task |

**Decision rule:** choose A only after the GPU pilot passes and manipulation remains the interest; choose B for systems/flight questions or no GPU; choose C for statistics/assurance. A candidate may replace two Q3 Rung-3 B hours with the §11.5 environment/checkpoint pilot; record the substitution, and choose B/C if it fails. If undecided, choose B. Its simulation and logging skills transfer directly to C.

### 14.2 Equal-hour course and project substitutions

The tables below are binding. They replace the Track-B wording in §8.2 and §15.5 without changing any F/P/B/E/W/C/R quarter total, buffer, or weekly load.

**F-hour substitutions after the month-9 choice** (`core + 20 h extension`):

| Quarter; F hours | Track A | Track B | Track C |
|---|---|---|---|
| Q4; **15 + 10** | M6 5 + M7 10; extension M7 5 + M8 5 | M5 5 + M6 5 + M7 5; extension M7 5 + M8 5 | M3 safety 5 + M8 5 + M11 5; extension M1/EE364A 5 + M11 5 |
| Q5; **12 + 8** | M7 5 + M8 5 + M11 2; extension M8 5 + M11 3 | M7 10 + M8 2; extension M8 5 + M10 3 | M1/EE364A 4 + M3 4 + M11 4; extension M1 3 + M11 5 |
| Q6; **10 + 5** | M8 5 + M11 5; extension M11 5 | M8 3 + M9 5 + M10 2; extension M10 2 + M11 3 | M3 3 + M8 3 + M11 4; extension M11 5 |
| Q7; **8 + 2** | M11 8; extension M11 2 | M10 3 + M11 5; extension M11 2 | M11 8; extension M11 2 |
| Q8; **5 + 0** | M11 5 | M10 5 | M11 5 |
| **Post-choice total** | **50 + 25** | **50 + 25** | **50 + 25** |

**Rung 4–6 substitutions** (B/E hours are identical across tracks):

| Rung and 10 h / 20 h B/E | Track A artifact | Track B artifact | Track C artifact | Acceptance closes |
|---|---|---|---|---|
| R4: **45/45; 55/85** | Frozen simulated push/placement suite, compact scripted/BC baseline, reset and shift logs | Frozen PX4 mission/landing suite, ULogs, detector and failsafe pilot | Frozen constrained-control suite, monitor-off baseline, fault injector and violation logs | 10 h: Q6; 20 h: Q5 |
| R5: **30/45; 60/90** | Immutable Diffusion Policy author run, or `not testable` and track switch; one perturbation only after unchanged run | §11.5 checkpoint observed-metrics check, then all Figure-5 conditions or an explicitly labeled partial/checkpoint study | Same artifact plus an audited task-compatible safety filter, or monitor-only constraint metrics if none passes preflight; separate reference-error and violation metrics | 10 h: Q7; 20 h: Q6 |
| R6: **21/81; 50/135** | Calibrated shift gate on the R4 manipulation task, frozen confirmatory suite | Calibrated landing gate on the R4 PX4 task, frozen confirmatory suite | Calibrated runtime monitor or simulator-ranking study, frozen confirmatory suite | Q8 in 10 h; Q7 in 20 h |

Rungs are **overlapping work packages with sequential acceptance gates**, not a staircase in which every hour of one rung must finish before any preparatory hour of the next. Interface definition and pilot setup may overlap. A later rung may not enter frozen confirmatory testing until the earlier rung's acceptance gate has closed.

### 14.3 Binding month-10-to-24 substitution map

Months 1–9 remain common. In each row below, the selected track replaces the Track-B task in §15.5 for the same month's F/P/B/E/W/C/R envelope. The paper branch is the exact §15.4 branch; writing, career, legal, and buffer hours do not change.

| Month | Track A replacement | Track B replacement | Track C replacement |
|---|---|---|---|
| 10 | Freeze MuJoCo manipulation task, reset protocol, scripted baseline, failure events | Freeze PX4 SITL, mission/reset protocol, ULog and failsafe states | Freeze constrained plant/task, fault injector, monitor-off baseline, violation definition |
| 11 | Build compact BC policy/data split; profile latency; one visual/object shift | Build landing detector/pose baseline; split by scene/texture; profile latency | Implement nominal controller plus CBF or runtime-monitor baseline; profile solver/control latency |
| 12 | Join policy and controller; 50 nominal + ≥20 disturbed pilot episodes; R4 pilot | Join detector and fixed landing controller; same pilot counts; R4 pilot | Run 100 fixed nominal/fault cases; report task success, violations, interventions; R4 pilot |
| 13 | Freeze manipulation-shift thesis, data budget, compute ceiling and stop rules | Freeze landing-gate thesis, shifts, compute ceiling and stop rules | Freeze assurance/benchmark thesis, uncertainty model, fault distributions and stop rules |
| 14 | Run immutable Diffusion Policy artifact unchanged after GPU pilot | Run §11.5 `safe-control-gym` README command and selected paper comparator | Run same immutable artifact; run a safety filter unchanged only if its exact task/config/licence preflight passes |
| 15 | Clean rerun and artifact/reproduction-boundary report | Clean rerun; Figure-5/6 mapping or checkpoint-only report | Clean rerun; separate reference-error and violation report |
| 16 | Implement calibrated temporal gate and matched-abort control for manipulation | Implement calibrated temporal landing gate and matched-abort control | Implement calibrated monitor/intervention rule and matched-intervention control |
| 17 | Run illumination, occlusion, object-pose and latency shifts | Run illumination, blur, occlusion and camera-latency shifts | Run model error, observation noise, delay and packet-loss shifts |
| 18 | Ablate history/calibration size; validation-only threshold selection; freeze | Same, plus landing error taxonomy; freeze | Ablate uncertainty input/monitor; validation-only threshold selection; freeze |
| 19 | Frozen manipulation confirmatory test | Frozen landing confirmatory test | Frozen assurance/ranking confirmatory test |
| 20 | Independent rerun; 20 h also starts R7 target-machine timing/fault work | Independent rerun/second simulator; 20 h starts R7 timing/fault work | Independent rerun/second simulator; 20 h starts R7 timing/fault work |
| 21 | Release candidate and cards; 20 h runs R7 endurance/fault pilot | Same with ULog/airspace boundary documentation and R7 pilot | Same with guarantee assumptions, intervention cost, null-result boundary, and R7 pilot |
| 22 | Full manuscript; 20 h also closes R7 edge latency/endurance or software timing substitute | Full manuscript; same R7 hardware-or-substitute work | Full manuscript; same R7 hardware-or-substitute work |
| 23 | Two reviews and artifact freeze; 20 h runs R8 contained tabletop trial or external/second-simulator substitute | Two reviews and artifact freeze; 20 h runs contained Gate-H trial or substitute | Two reviews and artifact freeze; 20 h runs contained bench trial or external/second-simulator substitute |
| 24 | Portfolio, applications, retrospective; finish R7/R8 substitute and final evidence table | Same | Same |

The 20 h **software substitute for R7–8 is mandatory when hardware is unavailable**. R7 spans months 20–22: 20 B/40 E hours for target-machine timing, CPU/network contention, process/link/power-fault emulation, and a 60-minute endurance run. R8 spans months 23–24: 10 B/50 E hours for a clean-room rerun plus a second-simulator held-out study. The same B/E hours apply if Gate-H hardware replaces the matched validation task. These hours never disappear into manuscript time.

---

## 15. Two 24-month plans: 10 h/week and 20 h/week

### 15.1 The thesis contract after the month-9 track choice

**[JUDGMENT]** Both weekly plans use **one** thesis, selected from §14.1: Track A manipulation shift-gating, Track B visual landing, or Track C runtime assurance/benchmark validity. Each keeps one embodiment, one primary simulator, one compact candidate method, an inspectable baseline, a matched-stop/intervention control, a frozen shift suite, and a preregistered trade-off ceiling. The common effect target is a ≥30% relative reduction in the track's failure or violation rate while losing no more than 10 percentage points of task completion; missing it is a valid result. Track-specific metrics are: A, failed-push rate, completion, unnecessary stops, calibration, and latency; B, unsafe-touchdown rate, completion, unnecessary aborts, detection lead time, risk-coverage, calibration/Brier score, and latency; C, violation-episode rate, task success, intervention rate, risk-coverage, calibration, and solver/control latency. Claims stay within the named simulation conditions and never establish certification, outdoor safety, or general robot competence. §14.2–14.3 provide the binding substitutions; the month table below shows Track B wording as the default example only.

### 15.2 Scope contract

| Constraint | 10 h/week (1,040 h) | 20 h/week (2,080 h) |
|---|---|---|
| Embodiments | One selected track embodiment/task | Same selected embodiment; no second embodiment |
| Environment | One primary simulator; no mandatory cross-simulator work | Same primary; one second-simulator check required in Rung 6/Q7 unless replaced by a preapproved independent hardware/remote-lab validation using the same 60+ hour allocation |
| Public-artifact studies | One track-specific artifact under §11.5; B/C use the bounded `v1.0.0` profile, with checkpoint-only work labeled | Two baselines or the same artifact plus required independent/cross-simulator stress test; Track A uses the author GPU profile only after its pilot |
| Thesis models | One compact baseline; raw score, calibrated score, and temporal/runtime gate | Two credible baselines; wider calibration and sensitivity analysis |
| Randomness | §11.5: 3 training seeds when training; otherwise ≥5 scenario seeds and ≥100 episodes/condition | §11.5: 5 training seeds when training; otherwise ≥10 scenario seeds and ≥200 episodes/condition |
| Perturbations | Four track-specific shifts named in §14.3 | Six, two interaction tests, one cross-domain check |
| Hardware | None | Optional contained track-appropriate hardware after Quarter 6; never required; use the §14.3 software substitute otherwise |
| Open source | One clean public-artifact/thesis repository | Same plus one upstream contribution and an external clean-room rerun |
| Writing | Artifact-boundary report, thesis-style report, workshop-quality manuscript if evidence supports it | Strong workshop or full-conference attempt or journal-quality technical report; acceptance is not a gate |
| Career applications | At most 3 well-matched applications per cycle | Up to 6, or one structured 8–12-week collaboration replacing project hours |
| Excluded in both | New robot hardware before the gate, multiple autopilots, foundation-model pretraining, outdoor flight, broad "physical AI" surveys | Large-scale pretraining and uncontrolled outdoor flight remain excluded |

### 15.3 Time accounting

104 weeks in eight 13-week quarters: 11 build weeks, one integration/reproduction week, one gate/buffer week. 10 h × 104 = 1,040 h; 20 h × 104 = 2,080 h. The §17 monitoring routine sits inside the paper, writing, and community columns. If a buffer week is lost to illness or work, drop a stretch item; never carry hour debt. Columns: F foundations/coursework; P paper discovery and deep reading; B implementation; E controlled experiments; W writing; C community, mentors, career; R review/buffer.

**10-hour path**

| Quarter | Emphasis | F | P | B | E | W | C | R | Total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Q1 | Numerical work, mathematics, mechanics, research habits | 50 | 10 | 35 | 8 | 12 | 5 | 10 | 130 |
| Q2 | Geometry, dynamics, feedback, sensor/electronics literacy | 35 | 12 | 38 | 18 | 10 | 7 | 10 | 130 |
| Q3 | Estimation, planning, ROS integration | 25 | 15 | 35 | 28 | 10 | 7 | 10 | 130 |
| Q4 | Track-specific Rung-4 closed-loop pilot after the month-9 choice | 15 | 18 | 30 | 35 | 12 | 10 | 10 | 130 |
| Q5 | Track literature/protocol and public-artifact study | 12 | 18 | 25 | 40 | 15 | 10 | 10 | 130 |
| Q6 | Track gate/monitor, shifts, core ablations | 10 | 16 | 20 | 45 | 17 | 12 | 10 | 130 |
| Q7 | Frozen evaluation, independent rerun, release candidate | 8 | 15 | 20 | 45 | 20 | 12 | 10 | 130 |
| Q8 | Manuscript, artifact, portfolio, applications | 5 | 12 | 15 | 30 | 38 | 20 | 10 | 130 |
| **Total** | | **160** | **116** | **218** | **249** | **134** | **83** | **80** | **1,040** |

**20-hour path**

| Quarter | Emphasis | F | P | B | E | W | C | R | Total |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Q1 | Foundations with more exercises and systems work | 85 | 18 | 75 | 25 | 20 | 12 | 25 | 260 |
| Q2 | Dynamics, control comparison, sensor simulation | 55 | 25 | 70 | 50 | 20 | 15 | 25 | 260 |
| Q3 | Estimation/planning alternatives and integration | 35 | 30 | 60 | 65 | 25 | 20 | 25 | 260 |
| Q4 | Track-specific Rung-4 pilot with a stronger second baseline | 25 | 35 | 55 | 75 | 25 | 20 | 25 | 260 |
| Q5 | Public artifact plus protocol and pilot study | 20 | 35 | 45 | 85 | 30 | 20 | 25 | 260 |
| Q6 | Wider ablations and sensitivity analysis | 15 | 30 | 40 | 90 | 35 | 25 | 25 | 260 |
| Q7 | Confirmatory study, cross-domain check, collaboration | 10 | 25 | 35 | 95 | 40 | 30 | 25 | 260 |
| Q8 | Paper, artifact, career transition, and explicit Rung-7/8 hardware-or-software substitute | 5 | 20 | 20 | 60 | 75 | 55 | 25 | 260 |
| **Total** | | **250** | **218** | **400** | **545** | **270** | **197** | **200** | **2,080** |

The extra 1,040 hours go mainly to experiments (+296), implementation (+182), writing (+136), community and collaboration (+114), and paper work (+102); reading does not simply double.

### 15.4 Non-overlapping unique-hours crosswalk

The quarterly tables assign every hour to one quarter; this table assigns every mandatory deliverable to one category. “Integrated” means a course concept is learned during F time and implemented during the separately listed B/E rung time; the same hour is never counted twice.

| Work package | 10 h plan | 20 h plan | Canonical contents |
|---|---:|---:|---|
| F course/foundation | 160 | 250 | Q1–Q3 common slices in §8; exact equal-hour Q4–Q8 A/B/C substitutions in §14.2 |
| P papers/monitoring | 116 | 218 | 10 h: 56 h common+one-track readings + 60 h technical monitoring. 20 h: the same 56 + 102 h second-branch/frontier depth + 60 h technical monitoring |
| B implementation | 218 | 400 | Exact per-rung B cells in §12.2 |
| E controlled experiments | 249 | 545 | Exact per-rung E cells in §12.2; Rungs 7–8 only in 20 h |
| W writing/lab record | 134 | 270 | 10 h: 38 lab/decision notes + 40 gate/reproduction reports + 56 manuscript/artifact docs. 20 h: 70 + 70 + 130 |
| C community/career/legal | 83 | 197 | 10 h: 20 mentor/external review + 28 career + 20 official legal/software checks + 15 upstream/community. 20 h: 55 + 77 + 20 + 45 respectively |
| R review/buffer | 80 | 200 | Ten hours/quarter in 10 h; 25 hours/quarter in 20 h. Never reassigned in advance |
| **Total** | **1,040** | **2,080** | No hidden overtime |

**Exact rung-to-quarter B/E map** (`R1 23/5` means 23 implementation hours and 5 experiment hours):

| Quarter | 10 h plan | 20 h plan |
|---|---|---|
| Q1 | R0 12/3 + R1 23/5 = **35/8** | R0 20/5 + R1 55/20 = **75/25** |
| Q2 | R1 12/15 + R2 26/3 = **38/18** | R1 0/15 + R2 50/35 + R3 20/0 = **70/50** |
| Q3 | R2 4/22 + R3 31/6 = **35/28** | R2 0/10 + R3 60/55 = **60/65** |
| Q4 | R3 14/24 + R4 16/11 = **30/35** | R3 0/5 + R4 55/70 = **55/75** |
| Q5 | R4 25/34 + R5 0/6 = **25/40** | R4 0/15 + R5 45/70 = **45/85** |
| Q6 | R4 4/0 + R5 16/39 + R6 0/6 = **20/45** | R5 15/20 + R6 25/70 = **40/90** |
| Q7 | R5 14/0 + R6 6/45 = **20/45** | R6 25/65 + R7 10/30 = **35/95** |
| Q8 | R6 15/30 = **15/30** | R7 10/10 + R8 10/50 = **20/60** |

Rungs are overlapping work packages with **sequential acceptance**. A later package may prepare interfaces or install an artifact after the prior interface is frozen, but it may not begin its frozen confirmatory test until the prior rung closes. Zero-implementation or zero-experiment cells are deliberate setup/evaluation carry-over, not missing work.

| Quarter | 10 h nonzero-cell subtask and artifact | 20 h nonzero-cell subtask and artifact | Acceptance closure |
|---|---|---|---|
| Q1 | R0 12/3: environment manifest, deterministic reruns; R1 23/5: model/controller skeleton and first perturbation | R0 20/5: two-environment deterministic check; R1 55/20: controller implementation and initial sweep | R0 Q1; R1 remains open |
| Q2 | R1 12/15: held-out disturbance suite and report; R2 26/3: estimator/noise-model implementation and pilot | R1 0/15: held-out stress closes R1; R2 50/35: estimator, calibration, dropout suite; R3 20/0: message/frame/QoS interface schema | R1 Q2 |
| Q3 | R2 4/22: consistency/dropout evaluation; R3 31/6: ROS graph, planner, replay pilot | R2 0/10: final consistency test; R3 60/55: ROS/planning build, 100-map suite, timing/fault pilot | R2 Q3 |
| Q4 | R3 14/24: 100-map, QoS and replay acceptance; R4 16/11: selected track task/reset/logging scaffold and pilot | R3 0/5: independent replay acceptance; R4 55/70: selected track closed-loop build, nominal and disturbed pilot | R3 Q4 |
| Q5 | R4 25/34: complete controller/model integration and most frozen disturbance matrix; R5 0/6: unchanged artifact installation and health-signature pilot | R4 0/15: held-out R4 stress closes it; R5 45/70: unchanged artifact, comparator implementation, source-metric runs | R4 in 20 h Q5 |
| Q6 | R4 4/0: package/configuration closure; R5 16/39: comparator, source-metric runs and discrepancy tests; R6 0/6: preregistered exploratory cells | R5 15/20: clean rerun and discrepancy closure; R6 25/70: gate/monitor implementation and exploratory shift matrix | R4 in 10 h Q6; R5 in 20 h Q6 |
| Q7 | R5 14/0: reproducibility package closes R5; R6 6/45: confirmatory harness and frozen runs | R6 25/65: frozen confirmatory/second-domain work; R7 10/30: target-machine or software-substitute timing/fault setup and endurance pilot | R5 in 10 h Q7; R6 in 20 h Q7 |
| Q8 | R6 15/30: final robustness runs, clean rerun and artifact tables | R7 10/10: endurance/fault acceptance; R8 10/50: contained hardware study **or mandatory clean-room plus second-simulator substitute** | R6 in 10 h Q8; R7 and R8 in 20 h Q8 |

Each per-rung total re-sums to §12.2 and each quarter to §15.3. Track-specific meanings of R4–R6 are fixed in §14.2; R7–R8 work is named in months 22–24 in §14.3.

**Exact P-hour map:** technical monitoring is 4, 4, 6, 8, 10, 10, 9, 9 hours in Q1–Q8 = 60. The remaining 56 hours are readings: Q1 6 (RL-10 2, RL-23 3, RL-15 1); Q2 8 (RL-15 4, RL-18 4); Q3 9 (RL-18 1, RL-19 6, RL-25 2); Q4 10 (RL-25 4, RL-31 5, first branch hour); Q5/Q6/Q7/Q8 branch hours 8/6/6/3. Track-branch assignment is:

| Track | Q4 1 h | Q5 8 h | Q6 6 h | Q7 6 h | Q8 3 h |
|---|---|---|---|---|---|
| A | RL-24 1 | RL-24 2 + RL-28 6 | RL-28 1 + RL-29 5 | RL-29 2 + RL-32 3 + RL-33 1 | RL-33 3 |
| B | RL-12 1 | RL-12 4 + RL-13 4 | RL-13 1 + RL-34 4 + RL-35 1 | RL-35 4 + RL-36 2 | RL-36 3 |
| C | RL-3 1 | RL-3 5 + RL-11 3 | RL-11 3 + RL-14 2 + RL-20 1 | RL-20 4 + RL-21 2 | RL-21 3 |

The 20 h plan uses the same 56 reading + 60 monitoring hours and assigns its extra **102 P hours** to at most 17 additional unique deep reads (a second branch plus selected frontier depth) by Q1–Q8 as 8/13/15/17/17/14/10/8. That exactly produces the 20 h P column; it adds no feeds. The 10 h plan's monitoring allocation permits only the bounded evidence skims in §16.1, not extra mandatory deep reads.

Quarter placement is exactly the Q1–Q8 allocation in §15.3. If a learner substitutes a course, paper, reproduction, internship, or hardware-access session, it replaces equal hours in the same category and quarter. It is never added on top.

### 15.5 Month by month

The shared column is mandatory in both plans; the last two columns show the real scope difference. Weeks are counted 4 + 4 + 5 per quarter.

| Month (weeks; 10 h/20 h) | Shared work | Required deliverable | 10 h reduced scope | 20 h extension |
|---|---|---|---|---|
| 1 (W1–4; 40/80) | Entry diagnostic; Python numerical refresh; units, plots, seeds, environment capture; start lab notes | Diagnostic memo; reproducible noisy-line and first-order-system experiment; gap list | Notebook or script, no framework | Linux tooling and a small C++ exercise |
| 2 (W5–8; 40/80) | Selected linear algebra, derivatives/integrals, numerical integration, probability, force/torque, inertia (M0, MML chs. 2–6) | 2-D transform and point-mass simulation with units and tests | Skip proofs beyond what the calculation needs | Derive the model two ways; compare integrators and step sizes |
| 3 (W9–13; 50/100) | ODE intuition, feedback, PID, train/validation/test discipline, first paper memos (M1 selections) | Controlled first/second-order plant; **Q1 gate report**; one two-page paper critique | One controller, one disturbance | Two controllers, parameter sensitivity, peer review of a notebook |
| 4 (W14–17; 40/80) | Rigid transforms, frames, rotations, forward kinematics, calibration concepts (M2 begins) | Transform library; frame diagram; synthetic calibration-error experiment | Planar plus minimal 3-D | Full SE(3) examples and edge cases |
| 5 (W18–21; 40/80) | Rigid-body dynamics, actuator/sensor models, PID tuning, optimization basics (M2) | One bounded plant, such as a planar quadrotor or simple arm, with tracking and logs (Rung 1) | PID only | Add LQR as a comparison |
| 6 (W22–26; 50/100) | Electronics literacy without hardware: V/I/P, PWM, UART/I²C/SPI, IMU and camera timing, batteries, motors/ESCs, aliasing (M4 literacy); stress the controller | Virtual sensor/actuator interface spec; mass/latency/noise disturbance report; **Q2 gate** | Datasheets and simulated sensors only | Optional supervised bench observation or makerspace induction; no free-flight build |
| 7 (W27–30; 40/80) | Conditional probability, Gaussian models, Bayes filtering, Kalman filter (Rung 2; Barfoot early chapters; M3 begins) | Seeded estimation experiment with RMSE, residual, and interval-coverage plots | Linear Kalman filter | Add EKF or factor-graph comparison after the linear case passes |
| 8 (W31–34; 40/80) | Search- and sampling-based planning, collision checking, trajectory representation (LaValle selections; M3) | A*/RRT planner over fixed seeded maps; failure taxonomy | One planner and one baseline | Two planners; computation/quality trade-off; adversarial maps |
| 9 (W35–39; 50/100) | ROS 2 concepts, timestamps, transforms, recording/replay, latency, deterministic evaluation (M5; Rung 3); complete the §14 decision memo | Integrated simulated sense-estimate-plan loop; replay regenerates the metrics table; **Q3 gate and Track A/B/C choice** | One process graph, one recording format | Fault injection, QoS/timing comparison, one upstream documentation fix |
| 10 (W40–43; 40/80) | Freeze the stack; PX4 SITL, simulator reset, mission state, logs, emergency-state semantics (Rung 4; use the NPTEL PX4 lectures as just-in-time reference) | Scripted nominal takeoff, approach, landing, abort, and reset protocol with complete logs | One airframe, one world | Second controller/configuration baseline in the same world |
| 11 (W44–47; 40/80) | Small visual landing-pad detector/pose estimator; data split by scene, texture, seed (M6–M7 material) | Data card; baseline model; nominal and shifted metrics; latency profile | One compact CPU-capable model | Second model family or public checkpoint; compute accounting |
| 12 (W48–52; 50/100) | Join perception to the fixed landing controller; define failure events; collect nominal and disturbed pilot episodes; confirm the month-9 choice (A/C use §14.3 replacements) | Closed-loop baseline package; 50 nominal and ≥20 disturbed pilot episodes; **Q4 gate** | No RL, no hardware | One stronger closed-loop baseline; external code review |
| 13 (W53–56; 40/80) | Focused literature table; thesis hypothesis, causal comparison, metrics, exclusions, compute ceiling, stop rules | Two-page protocol and analysis plan; frozen partitions; ethics/safety checklist | About 20 anchors for discovery; the eight completed deep reads must be named §7 spine/branch items | About 35 anchors; up to 15 completed unique deep reads only if paid by the 102-hour P extension; one citation-graph audit |
| 14 (W57–60; 40/80) | Run the §11.5 track artifact unchanged first (Rung 5); B/C use `safe-control-gym` `v1.0.0`, A only after its GPU pilot | Artifact run, immutable identity and hashes, resolved manifest, scenario/seed table, paper-result mapping, discrepancy log | One CPU artifact plus honest checkpoint-only/full-reproduction label | Two baselines or the author GPU profile plus unchanged result, under the 20 h rule |
| 15 (W61–65; 50/100) | Diagnose gaps; clean rerun; check the pilot task is neither floor nor ceiling | Artifact/reproduction-boundary report; independent rerun if available; **Q5 gate**; protocol revisions close | A well-explained mismatch can pass | A collaborator regenerates one selected source-metric table or the bounded observed-metrics check without private instructions |
| 16 (W66–69; 40/80) | Implement held-out calibration, temporal disagreement, and the predefined gate | Unit tests for state transitions; nominal risk-coverage curves; no-gate and matched-abort controls | Raw, calibrated, temporal gate only | Add an ensemble or another uncertainty baseline |
| 17 (W70–73; 40/80) | Run the prespecified shifts; track inference and control-loop timing | Complete exploratory matrix with intervals; every failed run retained | Main effects only | Add calibration error and wind/model mismatch; test two interactions |
| 18 (W74–78; 50/100) | Core ablations; threshold sensitivity on validation only; error taxonomy; negative-result analysis | Ablation report; frozen confirmatory configuration; **Q6 gate** | At most four gate variants and four shifts | Wider sensitivity analysis; cross-simulator pilot |
| 19 (W79–82; 40/80) | Frozen confirmatory test; no condition-by-condition retuning | Locked results, intervals, calibration/risk plots, compute ledger | One simulator; §11.5's 10 h seed/episode minimum | §11.5's 20 h minimum and episodes increased if pilot precision requires it |
| 20 (W83–86; 40/80) | Independent rerun and robustness check; methodological reviewer sought (A/C use §14.3 replacements) | Reproduction checklist completed by someone else; response memo | Configuration inspection plus one rerun | Required second-simulator validation **and start Rung-7 timing/fault substitute**; Gate-H hardware may replace only the matched validation portion |
| 21 (W87–91; 50/100) | Artifact, limitations, negative outcomes, model/data/system cards, licence review, safe-use note | Release candidate installable from a clean environment; **Q7 gate** | One repository, one archival candidate | Upstream contribution, artifact rehearsal, and Rung-7 endurance/fault pilot |
| 22 (W92–95; 40/80) | Write from claim to evidence; A/C use §14.3 thesis wording | Full draft with every claim linked to a result or source | Thesis-style technical report first | Conference-form manuscript **plus close Rung-7 endurance/fault acceptance** |
| 23 (W96–99; 40/80) | Two external reviews; revision; artifact freeze; talk/poster; submission decision by venue fit | Revised manuscript; public artifact if legal and safe; submission or explicit no-submit memo | Workshop or technical-report route suffices | Begin Rung-8 contained Gate-H study or mandatory clean-room plus second-simulator substitute; revise manuscript in W time |
| 24 (W100–104; 50/100) | Portfolio audit, mentor debrief, applications, next 12-month question | **Q8 gate**; evidence portfolio; application packet; retrospective including stopped work | At most three strongly matched applications | Finish Rung 8 and its evidence table; archival DOI; up to six applications or one collaboration, not both |

### 15.6 Quarterly gates

A gate asks whether the evidence is trustworthy enough to continue; a positive thesis result is never required.

| Gate | Pass evidence | If it fails | Added 20 h evidence |
|---|---|---|---|
| Q1 (W13) foundations | Seeded rerun works; units in code and plots; least squares explained; feedback simulation stable under one prespecified perturbation; 500-word memo separates result from interpretation | Four remediation weeks; drop LQR and C++ extensions; do not start ROS | Integrator/controller comparison and one peer review |
| Q2 (W26) physical/control literacy | Consistent frames; planar dynamics and PID track a reference; mass or delay disturbance logged; motor/ESC/IMU/camera timing and power explained at literacy level | Simpler point-mass model; controls mentor inspects signs, units, frames | Model-based comparator and parameter sweep |
| Q3 (W39) autonomy primitives and track choice | Estimator beats raw measurements with interval coverage; planner succeeds on ≥95 of 100 feasible maps or explains each failure; recorded data regenerates the table; §14 decision memo selects A/B/C against GPU/interest/theory criteria | Keep estimator linear and planner simple; default to B if the track evidence is incomplete | Second estimator/planner; timing and fault tests |
| Q4 (W52) track closed-loop pilot | Reproducible resets; no missing logs; failure events computed without watching video; both successes and failures in the selected A/B/C pilot; train/validation/test cases separated | Simplify to the track's scripted/classical controller plus one compact learned or monitored component; adjust pilot difficulty once, then refreeze | Second baseline and outside code review |
| Q5 (W65) artifact and protocol | Public artifact health check runs; exact result locator and checkpoint-only/full-reproduction boundary stated; discrepancy report tests ≥3 causes where needed; deviations, seeds/scenarios, compute, storage, checksums and licences listed; final thesis test untouched | Narrow the thesis to the executable subset; never relabel a port or checkpoint check as the paper result | Independent comparator rerun; second baseline |
| Q6 (W78) experiment validity | All preregistered cells and ablations ran; censored runs explained; thresholds chosen on validation; intervals and timing present; confirmatory configuration frozen | Reduce perturbations or methods, not reporting quality | Interaction tests; cross-simulator pilot |
| Q7 (W91) independent evidence | Confirmatory runs on the frozen test; no seed discarded for performance; another person regenerates a figure; limitations, negatives, safety boundaries explicit | Release a reproduction or negative-result report rather than a method claim | Cross-domain or contained hardware evidence; artifact rehearsal; upstream contribution |
| Q8 (W104) external usefulness | Complete report and archival artifact; two external reviews with written responses; portfolio shows decisions and failures; next question follows from evidence | One bounded revision; do not chase acceptance indefinitely | R7 and R8 hardware-or-software-substitute acceptance records, stronger submission package, collaborator authorship record |

**Hardware Gate H (20 h plan only, optional):** Q6 passed; a competent supervisor and contained area exist; current jurisdiction, airspace, registration, radio, insurance, institution, and local rules checked (§13); containment, battery and fire procedure, arming checklist, abort operator, and incident plan documented; simulation and HIL tests passed; and the hardware test answers a question simulation cannot. Otherwise stay in simulation. This document never authorises a flight.

### 15.7 Fallback routes

| Situation | Route |
|---|---|
| Weak mathematics at month 3 | Repeat Q1 remediation once using the assigned buffer and by deleting equal extension/project-scope hours; use MIT 18.06SC/18.05 extracts. Keep the 104-week total and do not compensate with hardware or RL. |
| No GPU | Select Track B or C; use the bounded `safe-control-gym` `v1.0.0` artifact and compact CPU perception; exclude faithful Diffusion Policy, VLA fine-tuning, and Isaac Sim. Call a checkpoint-only run exactly that, and never silently convert the author task into a CPU/MuJoCo “reproduction.” |
| No hardware ever | Entirely valid: 10 h ends at Rung 6. In 20 h, use the binding §14.3 substitute: R7 target-machine timing/fault/endurance (20 B/40 E) and R8 clean-room plus second-simulator held-out validation (10 B/50 E). |
| No flight space | Same as above; if a hardware question remains, route it to a tabletop arm or an institution. |
| Full-time job | 10 h plan; 30-minute minimum monitoring week (§17); protect the gate weeks; accept one quarter of slip rather than hour debt. |
| Internship or 12-week collaboration begins | Its relevant hours replace B/E/C hours; do not stack it on top of 20 h and a job. |

---

## 16. Research practice and career development

### 16.1 Paper reading and the literature table

**Binding reading contract.** The 10 h plan has exactly **12 unique mandatory deep reads**: seven common-spine items and the five items in the selected branch, paid by the 56 reading hours in §7.2/§15.4. The quarter-by-quarter item map, not a generic “one paper every two weeks” slogan, sets the cadence. Revisiting an item's derivation, appendix, code, or result during its assigned hours is a repeated pass, not a new paper. The 60 monitoring hours pay for title/abstract triage and at most **eight additional evidence skims** of up to two hours each; they do not create a hidden deep-reading requirement. The 20 h plan keeps those 12, then uses its separate 102 P-hour extension for at most **17 additional unique deep reads**, including one second branch if useful; any monitoring-derived skim still stays inside the same 60 monitoring hours. Thus the binding ceilings are 12 unique deep reads in the 10 h plan and 29 in the 20 h plan. More papers are not a success metric.

Three passes: **claim pass** (10 min: problem, contribution, embodiment, task, primary metric, strongest comparison; drop it if none can be stated); **evidence pass** (30–45 min: split, simulator or hardware, control frequency, training budget, baselines, seeds, uncertainty, failures, closed-loop versus offline); **reproduction pass** (45–90 min: artifacts, versions, licences, hidden assumptions, compute, the smallest falsifying experiment). Every note ends with `cite`, `deep-read`, `reproduce`, `monitor citations`, or `drop: reason`.

Literature-table columns (also the §17 queue header): canonical ID, version date, title, authors, venue status, task, embodiment, system layer, data scale, training budget, sim or hardware, closed-loop, baseline, metric, reported effect, uncertainty, seeds/trials, artifacts and licence, compute/hardware cost, replication status, failure modes, safety/ethics, claim status, next action.

### 16.2 Reproduction protocol

1. Freeze the exact paper version; distinguish final proceedings from arXiv/OpenReview versions.
2. List the claimed metric, table/figure locator, expected uncertainty, environment, data, checkpoint, compute.
3. Run the authors' artifact unchanged when possible; save raw output before adapting.
4. Record every deviation; a dependency substitution can explain a discrepancy.
5. Follow §11.5 exactly: ≥3 training seeds in the 10 h plan or ≥5 in the 20 h plan when training is stochastic; evaluation-only work uses ≥5/≥10 scenario seeds and ≥100/≥200 episodes per condition respectively, unless a documented precision calculation requires more.
6. Separate debugging, exploratory tuning, and confirmatory testing; never tune on the final scenario set.
7. Report `matched`, `partially matched`, `not matched`, or `not testable` with reasons; an explained non-match can pass Q5.
8. Compare task, embodiment, simulator/hardware, metric definition, data budget, model size, compute, and closed-loop setting before comparing numbers.

### 16.3 Lab-note template (one append-only entry per session)

```text
UTC date/time:
Question / hypothesis:
Decision this run can change:
Code or artifact version:
Environment and dependency lock:
Data/simulator/world/checkpoint versions:
Seed(s), episode IDs, configuration hash:
Hardware and safety state, if any:
Command or reproducible invocation:
Expected outcome and predeclared metric:
Observed raw artifacts:
Result with uncertainty:
Anomalies, missing runs, suspected causes:
Interpretation, separated from observation:
Next action / stop decision:
```

Weekly: a one-paragraph decision log. Monthly: a two-page memo with one figure, one table, one failure, one decision. A screenshot or flight video is not a lab record.

### 16.4 Negative results

| Class | Meaning | Response |
|---|---|---|
| Implementation failure | The intended method was not faithfully run | Fix or mark not testable; infer nothing scientific |
| Reproduction discrepancy | Faithful attempt does not match | Preserve configs; test version, data, metric, seed causes; publish the discrepancy scope |
| Underpowered or uninformative | Wide intervals; floor/ceiling task | Redesign from pilot data before the freeze, or narrow the claim |
| Null result | Near-zero effect with useful precision | Report interval and practical bound; no post-hoc subgroup hunting |
| Harmful trade-off | Safety improves only through unacceptable aborts, latency, or compute | Show the full risk-coverage curve; reject for the stated use |
| Boundary result | Works in one shift, seed, or simulator only | State the boundary; do not average it away |

Never delete "bad" seeds or inconvenient baselines; mark corrupted runs by a rule written before inspecting performance.

### 16.5 Writing schedule and claim form

Monthly two-page memo; quarterly gate report including what stopped and why; month 15 reproduction report with methods appendix; month 18 methods/protocol/preliminary-results draft before confirmatory results are known; month 21 limitations, ethics, and artifact documentation; month 22 complete manuscript; months 23–24 response to review and archival version. Write claims as "Under conditions X, intervention Y changed metric Z by estimate and interval relative to baseline B." Avoid "robust", "safe", "general", and "state of the art" unless the scope and comparison justify them.

### 16.6 Ethics and responsible release

Use the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) as a risk-question checklist (not a certification) and the [NeurIPS Ethics Guidelines](https://neurips.cc/public/EthicsGuidelines) as a publication prompt (both HTTP 200 on 20 October 2026). Before collecting or releasing data: identify any identifiable people, homes, vehicles, or location traces and obtain lawful authority or consent, minimize, and set retention; state misuse risks (surveillance, weaponization, unsafe autonomy, geofence bypass) and limit deployment claims; check dataset, asset, checkpoint, and code licence compatibility; obtain institutional review for any human-subject data; report compute, energy, and hardware costs; call a fallback "simulated" unless it stays safe when localization, communication, or actuation fails; recheck aviation, spectrum, privacy, institutional, and local requirements immediately before any physical test.

### 16.7 Open-source ladder

| Milestone | 10 h requirement | 20 h addition |
|---|---|---|
| Months 1–3 | Repository with README, environment capture, seed, one reproducible figure | Automated checks; second-machine rerun |
| Month 9 | Integration example with timestamp/frame diagram and log replay | Small upstream documentation or test contribution |
| Month 15 | Reproduction package with original artifact preserved and deviations documented | External clean-room rerun; issue or patch offered upstream |
| Month 21 | Thesis release candidate with licence, citation file, cards, raw-result manifest, plotting recipe, safety limits | Archival DOI; artifact-review rehearsal; one maintained upstream contribution |
| Month 23 | Tagged artifact matching the manuscript; security and privacy scan | Issue template, contributor guide, bounded maintenance promise |

Do not publish third-party weights or data without permission. A small artifact another person can run beats a large repository only its author understands.

### 16.8 Mentors, collaborators, and where to find them

Build a three-role board: a **methods mentor** (evaluation, uncertainty, statistics, reproducibility), a **domain mentor** (estimation, control, aerial robotics, simulator validity, safety), and a **research/career mentor** (question selection, writing, venue fit, applications). One person may cover two roles; none should cover all three. Ask for a 30-minute monthly review only when there is a memo, figure, failing test, or design decision to inspect; send a quarterly one-page update with `done`, `evidence`, `stuck`, `next gate`, and one specific question. A first request should name the reproduced result, the one falsifiable question, the artifact link, where your result differs, the two causes you tested, and ask for the most serious flaw in your evaluation plan or one missing control, promising no follow-up if they lack time.

Find collaborators through an author whose artifact you reproduced or improved; maintainers reached by a focused issue or patch; a local lab matching two literature-table entries; a workshop or doctoral consortium tied to the thesis; and the [PX4/Dronecode developer forum](https://discuss.px4.io/) and [Dronecode Foundation](https://dronecode.org/) for narrow technical questions (community replies are advice, not safety or legal authority). Agree in writing on question, roles, artifact ownership, data access, cadence, authorship criteria, safety authority, and exit.

### 16.9 Career checkpoints and routes

| Month | Action | Evidence required first |
|---|---|---|
| 3 | One-page skills/gaps map; identify 10 labs or teams by research question | Diagnostic and Q1 gate report |
| 6 | Reduce to 5 targets; read two papers or projects from each | Dynamics/control artifact and one memo |
| 9 | One small upstream contribution or high-quality reproduction issue | Reproducible integration log |
| 12 | Two informational conversations; CV, transcript, portfolio index | Closed-loop baseline, not only certificates |
| 15 | Apply to an internship, mentorship, or research-assistant route if dates match | Reproduction report and one recommender who has seen the work |
| 18 | Decide: industry research engineer, research internship, research master's, or PhD | Thesis protocol, pilot evidence, funding/eligibility facts |
| 21 | Draft a statement of purpose around one question and its limits | External rerun and release candidate |
| 24 | Submit a few tailored applications; ask for specific letters | Complete portfolio and writing sample |

**Month-18 decision rule:** experiments and integration without open-ended theory, plus income needs → robotics/ML systems, simulation, autonomy, or test-and-evaluation engineering roles; reproductions plus a narrow original question but no mentorship → research master's or research-assistant role with a named adviser; sustained theory-and-experiment interest with strong letters and adviser fit → funded PhD applications to advisers and questions, not program names; a portfolio of tutorials with no independent artifact → spend 3–6 more months on Q4–Q5 evidence first; physical testing essential but inaccessible → join a lab or company with safety infrastructure rather than buying a larger drone.

**Routes verified live on 20 October 2026 (existence only; eligibility, deadlines, funding, and admission not inferred):**

| Route | Source | Observed |
|---|---|---|
| Indian graduate foundation | [IISc M.Tech./M.Des. admissions](https://www.iisc.ac.in/admissions/m-tech-m-des/) | Page listed Robotics and Autonomous Systems and Artificial Intelligence programmes; cycle deadline not recorded |
| Indian robotics research | [IIIT Hyderabad Robotics Research Center](https://robotics.iiit.ac.in/); [IIIT-H postgraduate admissions](https://pgadmissions.iiit.ac.in/) | Centre page showed 2026 activity; lab interest is not admission |
| Indian summer research | [Science Academies' Summer Research Fellowship Programme](https://www.ias.ac.in/Initiatives/Fellowship_Programmes/Summer_Research_Fellowship_Programme); [2026 portal](https://webjapps.ias.ac.in/fellowship2026/index.html) | 2026 registration closed; no 2027 cycle verified |
| Open-source mentorship | [Google Summer of Code](https://summerofcode.withgoogle.com/); [LFX Mentorship](https://mentorship.lfx.linuxfoundation.org/) | Annual organizations and cohorts change; contribute first |
| Industry early talent | [NVIDIA University Recruiting](https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/); [Microsoft Research India careers](https://www.microsoft.com/en-us/research/lab/microsoft-research-india/careers/) | Year-round internships described; no specific India robotics role verified |
| International research master's | [ETH Zurich MSc Robotics, Systems and Control](https://ethz.ch/en/studies/master/degree-programmes/engineering-sciences/robotics-systems-and-control.html); [TU Delft MSc Robotics](https://www.tudelft.nl/onderwijs/opleidingen/masters/robotics/msc-robotics); [University of Michigan Robotics graduate program](https://robotics.umich.edu/academics/graduate/) | Programme pages active; compare prerequisites, funding, thesis access |

### 16.10 Evidence-portfolio rubric

Ready when another technical reader can find within ten minutes: one problem statement and falsifiable hypothesis; one reproducible baseline and one explained discrepancy; raw-to-figure provenance with exact versions; closed-loop metrics, not only perception accuracy or video; ablations, intervals, compute and data accounting, all failed seeds; a negative result or stopped direction with a reason; one external review and response; licensing, provenance, ethics, and safety boundaries; a concise report and a five-minute mixed-audience explanation; evidence of reuse, a merged contribution, or an independent rerun. Follower counts and cinematic demos do not substitute.

---

## 17. Low-noise monitoring system

### 17.1 Hard limits

**Planned use: 80 hours over 104 weeks, already charged to P/C.** A normal week is 30 minutes; a month-end week is 90 minutes instead; a quarter-end week is 120 minutes instead. The 20 h plan keeps the same monitoring allocation and spends its extra paper hours on deliberate deep reading, not more feeds. A two-hour session is a hard ceiling, not a target. Minimum mode is the same 30 minutes. Never build backlog debt.

| Session | Minutes | Action | Hard output |
|---|---:|---|---|
| Normal week | 0–5 | Clear regulator/citation alerts and duplicates | Inbox zero/deferred |
| | 5–20 | Scan ≤10 filtered titles/abstracts from one query | ≤2 candidates |
| | 20–30 | Keep/drop, update one queue row, schedule one action | Queue ≤12 rows |
| Month-end replacement | 0–15 | Deduplicate versions; report `scanned→kept→deep→used` | Funnel metrics |
| | 15–45 | Final proceedings/benchmark/release changes | ≤2 additions |
| | 45–70 | Evidence-skim one item: protocol, failures, artifacts | One structured note |
| | 70–85 | Indian official legal/software check | Dated change or “none observed” |
| | 85–90 | Schedule one experiment and stop | Calendar block |
| Quarter-end replacement | 0–30 | Venue/proceedings and citation-challenge refresh | ≤3 dates; add/drop anchors |
| | 30–75 | Deep-read the best challenge or replication | One claim/evidence memo |
| | 75–105 | Audit benchmark artifacts, licences, independent tests | Status note |
| | 105–120 | Remove feeds and choose next quarter's three labs | Source list no larger |

### 17.2 Source priority

1. Final proceedings, DOI records, controlling regulations, standards bodies, official software releases.
2. Primary papers, OpenReview records, arXiv versions, benchmark protocols, code and data.
3. Independent replications, surveys, challenge reports, detailed lab seminars.
4. Lab and company announcements and aggregators, for discovery only.
5. Social posts and demo reels: excluded unless they link to a primary artifact.

The existing Ahead research feed Sudish already runs is a general AI feed and can serve as a level-4 discovery source; this report does not add robotics feeds to it or change its behavior.

### 17.3 Copyable queries (syntax-tested against the arXiv API on 20 October 2026)

**[FACT]** arXiv RSS/Atom feeds exist per category and update daily around midnight Eastern time ([arXiv RSS documentation](https://info.arxiv.org/help/rss.html)); [cs.RO](https://rss.arxiv.org/rss/cs.RO), [eess.SY](https://rss.arxiv.org/rss/eess.SY), and [cs.LG](https://rss.arxiv.org/rss/cs.LG) were live with a 20 October 2026 build date. Subscribe to `cs.RO` and `eess.SY`; add `cs.LG` only with local filters; do not subscribe to broad `cs.AI`. Query syntax follows the [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html).

```text
THESIS NARROW
(cat:cs.RO OR cat:eess.SY) AND (all:"precision landing" OR (all:landing AND all:quadrotor)) AND (all:uncertainty OR all:calibration OR all:failure OR all:robustness)

AERIAL AUTONOMY
(cat:cs.RO OR cat:eess.SY) AND (all:quadrotor OR all:UAV OR all:"aerial robot") AND (all:landing OR all:"visual-inertial" OR all:"GPS-denied")

SAFE AUTONOMY
(cat:cs.RO OR cat:eess.SY OR cat:cs.LG) AND (all:"runtime assurance" OR all:"control barrier function" OR all:"safe reinforcement learning") AND (all:robot OR all:quadrotor OR all:autonomous)

ROBOT-LEARNING EVALUATION
(cat:cs.RO OR cat:cs.LG) AND (all:"vision-language-action" OR all:"robot learning" OR all:"sim-to-real") AND (all:evaluation OR all:benchmark OR all:recovery)
```

[Run the thesis query directly](https://export.arxiv.org/api/query?search_query=%28cat%3Acs.RO%20OR%20cat%3Aeess.SY%29%20AND%20%28all%3A%22precision%20landing%22%20OR%20%28all%3Alanding%20AND%20all%3Aquadrotor%29%29%20AND%20%28all%3Auncertainty%20OR%20all%3Acalibration%20OR%20all%3Afailure%20OR%20all%3Arobustness%29&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending) (newest first, ten results).

Feed-reader include rules (case-insensitive; require one embodiment term and one method/evaluation term):

```text
\b(quadrotor|UAV|aerial robot|drone|visual[- ]inertial|GPS[- ]denied|precision landing)\b
\b(runtime assurance|control barrier|safe reinforcement learning|uncertainty|calibrat(e|ed|ion)|out[- ]of[- ]distribution|recovery)\b
\b(robot learning|embodied (AI|intelligence)|vision[- ]language[- ]action|VLA|sim[- ]to[- ]real|tactile|dexterous)\b
```

Drop networking-only "UAV" papers, medical-image "domain shift", and generic foundation-model papers without a closed-loop embodied evaluation.

**OpenReview.** API 2 is current and requires an account ([documentation](https://docs.openreview.net/getting-started/using-the-api)); use saved web searches one phrase at a time ([vision-based landing](https://openreview.net/search?term=vision-based%20landing); [runtime assurance](https://openreview.net/search?term=runtime%20assurance); [robot learning benchmark](https://openreview.net/search?term=robot%20learning%20benchmark)) and the venue groups [CoRL 2026](https://openreview.net/group?id=robot-learning.org/CoRL/2026/Conference), [NeurIPS 2026](https://openreview.net/group?id=NeurIPS.cc/2026/Conference), [ICML 2026](https://openreview.net/group?id=ICML.cc/2026/Conference). Final proceedings supersede submission metadata for citation identity.

**Google Scholar alerts (at most four; sort by date for monitoring):** `"vision-based landing" quadrotor uncertainty`; `"precision landing" UAV "domain shift"`; `"runtime assurance" quadrotor`; `"control barrier function" quadrotor perception` ([Scholar help](https://scholar.google.com/intl/en/scholar/help.html)). **Semantic Scholar:** weekly paper-citation alerts for at most five anchor papers plus your own ([FAQ](https://www.semanticscholar.org/faq)).

### 17.4 Venue watchlist (status at the cutoff)

| Venue | Verified status on 20 October 2026 | Cadence | Keep rule |
|---|---|---|---|
| ICRA | [Series page](https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra/) described ICRA 2027 (24–28 May) with the 15 September 2026 paper deadline past | Monthly for calls; once for proceedings | Aerial autonomy, estimation/control, safety/evaluation, or a method used in the thesis |
| IROS | [Series page](https://www.ieee-ras.org/conferences-workshops/financially-co-sponsored/iros/) linked IROS 2026 | Monthly around proceedings | Same |
| RSS | [RSS XXII proceedings](https://roboticsproceedings.org/rss22/) (13–17 July 2026) reachable; the [conference site](https://roboticsconference.org/) advertised a 4 December 2026 extended-abstract deadline for 2027 | Calls monthly; proceedings yearly | Deep-read at most two papers |
| CoRL | [CoRL 2026](https://www.corl.org/) scheduled 9–12 November 2026; accepted list posted 19 October; PMLR's latest final CoRL volume was [2025, volume 305](https://proceedings.mlr.press/v305/) | Accepted list once; PMLR once after publication | Embodied task, closed-loop evaluation, baseline or artifact |
| NeurIPS | [2026 schedule live](https://neurips.cc/); [proceedings archive](https://proceedings.neurips.cc/) had no 2026 volume | Schedule once; proceedings once | Embodiment plus action/control/sim-to-real/evaluation/safety |
| ICML | [PMLR volume 306](https://proceedings.mlr.press/v306/) published 29 September 2026 for the 6–11 July conference | One pass, then citations | Same physical-task rule; ≤2 deep reads |
| CVPR | [CVPR 2026 open access](https://openaccess.thecvf.com/CVPR2026?day=all): main papers 23 May 2026 | One annual pass | Robot/drone embodiment plus closed-loop, calibration, active perception, or sim-to-real |
| ICUAS | [ICUAS 2026](https://uasconferences.com/2026_icuas/) 15–18 June 2026, Corfu; [ICUAS 2027](https://uasconferences.com/2027_icuas/) announced 14–17 June 2027 | Monthly for call/program | UAS control, estimation, airworthiness, field evidence |
| CDC | [CDC 2026](https://cdc2026.ieeecss.org/) scheduled 15–18 December 2026 (not yet held) | Program once; proceedings after | Learning/control interaction, safety filters, MPC, runtime assurance tied to a physical system |
| ACC | [AACC directory](https://a2c2.org/events/acc) listed ACC 2027 for 6–9 July 2027 | Quarterly | Same as CDC |
| Control journals | [IEEE Control Systems Letters](https://www.ieeecss.org/publication/ieee-control-systems-letters); [IEEE TAC](https://www.ieeecss.org/publication/transactions-automatic-control) | One Scholar query monthly | `quadrotor/robot` + `safety/estimation/uncertainty/runtime assurance` |
| Robotics journals | [RA-L](https://www.ieee-ras.org/publications/ra-l/); [T-RO](https://www.ieee-ras.org/publications/t-ro/) | One Scholar query monthly | Thesis terms; final article over preprint |
| AUVSI XPONENTIAL | [Site](https://xponential.org/) advertised 17–20 May 2027 | One 20-minute quarterly scan | **[HYPE/DEMO]**: industry event; regulation, standards, and primary technical reports only |

IEEE Xplore returned HTTP 418 and SAGE, Wiley, AIAA, and ISO returned 403 to automated checks, so ICRA/IROS/ICUAS and control-journal inventories were not exhaustively verified; confirm each retained paper's DOI manually.

### 17.5 Benchmarks, labs, and regulators

**Benchmark tracking after Papers with Code [FACT]:** `paperswithcode.com` redirected (302) to [Hugging Face Trending Papers](https://huggingface.co/papers/trending) on 20 October 2026; popularity there is discovery data, not a maintained leaderboard. Replace with (1) primary metadata and citations, (2) the official benchmark protocol and repository (version, split, metric code, allowed data), and (3) the organizer-hosted result. Portals live at the cutoff: [EvalAI](https://eval.ai/web/challenges/list), [CodaLab](https://codalab.lisn.upsaclay.fr/competitions/), [AIcrowd](https://www.aicrowd.com/challenges), [MLCommons](https://mlcommons.org/benchmarks/); project pages [ManiSkill](https://www.maniskill.ai/), [BEHAVIOR](https://behavior.stanford.edu/), [RoboCasa](https://robocasa.ai/), [LIBERO](https://libero-project.github.io/main.html) (server date 2023; check the repository before calling it active). Maintain at most three benchmark watches; for Track B the primary benchmark is your own versioned landing stress-test protocol.

**Lab feeds:** subscribe to at most two XML feeds ([CMU Robotics Institute RSS](https://www.ri.cmu.edu/feed/), build date 15 October 2026, with an aerial/safety/learning filter; optionally [BAIR](https://bair.berkeley.edu/blog/feed.xml)) and check three thesis-matched labs manually each month (candidates: [UZH RPG](https://rpg.ifi.uzh.ch/), [ETH ASL](https://asl.ethz.ch/), [IIIT Hyderabad RRC](https://robotics.iiit.ac.in/), [Stanford ASL](https://stanfordasl.github.io/), [UPenn GRASP news](https://www.grasp.upenn.edu/news/)). Do not subscribe to [MIT CSAIL's RSS](https://www.csail.mit.edu/rss.xml): reachable but its newest item was dated 2019. Rotate labs quarterly by relevance, never by fame.

**Regulators:** see §13.6 for the India-first monthly check and global comparators; keep the [NIST news RSS](https://www.nist.gov/news-events/news/rss.xml) only with a `robot|autonomous system|AI risk|assurance|test and evaluation|safety` filter.

### 17.6 Triage, queue, and anti-doom-scroll limits

Keep an item only if it changes a thesis assumption, baseline, metric, perturbation, or safety boundary; supplies final proceedings, code/data, an independent reproduction, a negative result, or real closed-loop evidence; is a controlling legal or standards update; exposes benchmark leakage, failure modes, recovery behavior, or a cost/latency constraint; or identifies a collaborator approachable with a concrete artifact. Drop it if it has no embodiment or actionable mechanism, rests only on a vendor demo, duplicates a queued version, cannot establish task/split/metric/embodiment/closed-loop status, would require changing the thesis, or has no decision attached. Score survivors 0–2 on relevance, rigor, artifacts, and actionability: 6–8 deep-read; 4–5 citation-watch; 0–3 drop. Regulation and safety updates bypass scoring into the dated compliance log.

Queue header: `id, captured_utc, canonical_id, version_date, title, authors, source_url, source_type, venue_status, query_hit, task, embodiment, system_layer, data_scale, training_budget, sim_or_hardware, closed_loop, baseline, metric, reported_effect, uncertainty, seeds_trials, artifacts, artifact_license, compute_hardware_cost, replication_status, failure_modes, safety_ethics, claim_status, relevance_0_2, rigor_0_2, artifacts_0_2, actionability_0_2, next_action, owner, due_date, status, drop_reason, notes`. Controlled values: `source_type` final-paper | preprint | OpenReview | benchmark | code/data | replication | survey | standard | regulation | lab-announcement | vendor; `replication_status` independently-replicated | code+data | code-only | data-only | closed | unknown; `claim_status` author-claimed | peer-reviewed | independently-tested | contradicted | withdrawn | unknown.

Limits: 15 abstracts scanned a week; 3 saved, 1 deep-read, 1 experiment candidate a week; 12 active queue rows (≤6 deep-read, ≤2 experiment); unread items expire after 30 days; ≤8 feeds, 4 query alerts, 6 citation alerts, 3 benchmark watches, 3 watched labs; tighten or remove a source yielding >25 matches two weeks running; unsubscribe after three months without a retained item; cap conference release weeks at 20 abstracts and two deep reads; no X/Twitter, Reddit, YouTube recommendations, generic AI news, or vendor home pages during monitoring time; report `scanned → kept → deep-read → cited/experimented` monthly, and treat a growing "kept" count without changed claims as failure.

---

## 18. The Nobel question and verified relevant prizes

### 18.1 What official Nobel sources establish

- **[FACT]** There is no Nobel Prize category for computer science, engineering, artificial intelligence, robotics, drones, or physical AI as of 20 October 2026. The categories in Alfred Nobel's will are physics, chemistry, physiology or medicine, literature, and peace; the Sveriges Riksbank Prize in Economic Sciences in Memory of Alfred Nobel is a later memorial prize, and the official FAQ explains the absence of an engineering prize ([Nobel Prize FAQ](https://www.nobelprize.org/frequently-asked-questions/); [Alfred Nobel's will](https://www.nobelprize.org/alfred-nobel/alfred-nobels-will/); [prize overview](https://www.nobelprize.org/prizes/)). No future category or laureate is predicted here.
- **[FACT]** The statutes require that a work's importance be established through experience or expert scrutiny (§5); a prize may be shared by at most three people, with the Peace Prize also open to organizations (§4); personal applications are not considered, nominations come from competent nominators, and nomination records stay confidential for at least fifty years (§§7, 10); physics nominations are invitation-only ([Statutes of the Nobel Foundation](https://www.nobelprize.org/about/statutes-of-the-nobel-foundation/); [physics nomination process](https://www.nobelprize.org/nomination/physics/)). Current "Nobel nominee" claims are therefore normally unverifiable.
- **[FACT]** Precedents showing that instruments, methods, and computation can fit an existing category: the 1979 medicine prize for computer-assisted tomography ([summary](https://www.nobelprize.org/prizes/medicine/1979/summary/)); the 1986 physics prize for the electron microscope and the scanning tunneling microscope ([summary](https://www.nobelprize.org/prizes/physics/1986/summary/)); the 2017 physics prize for decisive contributions to the LIGO detector and the observation of gravitational waves, a collaboration of more than one thousand researchers credited to three individuals ([popular background](https://www.nobelprize.org/prizes/physics/2017/popular-information/)); the 2024 physics prize for foundations enabling machine learning with artificial neural networks ([summary](https://www.nobelprize.org/prizes/physics/2024/summary/)); the 2024 chemistry prize for computational protein design and protein-structure prediction ([summary](https://www.nobelprize.org/prizes/chemistry/2024/summary/)). None is a robotics precedent; each shows that the contribution had to be a physics, chemistry, or medical contribution on its own terms.
- **[FACT]** Recognition lag varies widely: the 2024 physics background dates Hopfield's associative-memory work to 1982 and the Boltzmann-machine publication to 1985, about 42 and 39 years before the award ([background](https://www.nobelprize.org/prizes/physics/2024/popular-information/)); the 2024 chemistry background dates Baker's cited de novo design step to 2003 and the AlphaFold2 CASP result to 2020, about 21 and 4 years ([background](https://www.nobelprize.org/prizes/chemistry/2024/popular-information/)); the LIGO account describes a vision almost fifty years old. Even a robotics field award waits: the ICRA Most Influential Paper Award evaluates papers from 18 to 22 years before the award year ([official page](https://www.ieee-ras.org/awards-recognition/society-awards/ieee-international-conference-on-robotics-and-automation-most-influential-paper-award/)).

### 18.2 How physical AI could, in principle, serve a Nobel domain **[JUDGMENT]**

| Domain | Credible contribution | Not enough |
|---|---|---|
| Physics | An autonomous instrument, sensing/control method, or platform that enables a fundamental observation or constitutes a major invention | A robot that is faster or more dexterous on a robotics benchmark |
| Chemistry | A robot-driven laboratory that produces a transformative chemical discovery whose chemical importance is the central result | Throughput or optimization demos without a major chemical result |
| Physiology or medicine | A robotic or AI experimental system that reveals a fundamental mechanism, or a validated transformative diagnostic or treatment | A surgical or assistive robot argued from engineering novelty or uptake |
| Peace | An actual peace achievement in which physical systems (demining, verification, humanitarian logistics) play a supporting role | Relabeling humanitarian robotics as "peace technology" |
| Literature; economics | No credible physical-AI route; do not force an economics framing onto robotics work | — |

**The counterfactual test:** if the robot were removed from the title, is there still a major physics, chemistry, or medical discovery to describe? If not, the work belongs to computing, robotics, or engineering awards.

**[JUDGMENT]** "Win a Nobel Prize" is not a plan. The controllable version is: choose an important problem; understand it more deeply than benchmark culture requires; produce evidence that survives hostile testing; leave artifacts others reproduce and extend. Contribution types with value whether or not recognition follows: a new phenomenon or mechanism; an enabling instrument; a general scientific method validated by domain experts; a transformative diagnostic or intervention judged on health outcomes; durable research infrastructure (benchmark, dataset, protocol, platform) trusted enough to expose failure modes across groups. Engineer fair attribution anyway: contribution statements, dated records, version history, written authorship agreements.

### 18.3 Selective prize audit, with uniform fields

`Not established` means the checked official page did not expose the field; it is safer than copying a third-party amount or recipient. Prize money is recorded only from an official page and is not converted to INR because it is not a planning budget.

| Exact prize / body | Purpose and physical-AI fit | Eligibility / career stage | Cadence and nomination route | Official amount at cutoff | Latest completed recipient/cycle verified | Official evidence and access caveat |
|---|---|---|---|---|---|---|
| **ACM A.M. Turing Award** / ACM | Lasting, trend-setting technical contribution to computing; direct fit for foundational learning, planning, perception, control, or systems | Computing contributor(s); ACM membership not required; FAQ permits close collaborators; not a generic lifetime award | Annual; a nominator submits the official package; next deadline displayed as 15 Dec 2026 AoE | **USD 1,000,000** | **2025 award:** Charles H. Bennett and Gilles Brassard, announced 18 Mar 2026 | [criteria/nominations](https://awards.acm.org/turing/nominations); [FAQ, 31 Mar 2025](https://awards.acm.org/binaries/content/assets/awards/a.m.-turing-award-faq.pdf); [official ACM announcement](https://www.acm.org/media-center/2026/march/turing-award-2025). HTML returned 403 to automation; the official PDF and official announcement identity were retained, not an unnamed rendering |
| **IEEE Robotics and Automation Award** / IEEE | Contributions across robotics/automation design, sensing, modeling, planning, control, and methods | Individual or team of up to three; career stage not restricted on the page | IEEE Technical Field Award; nomination through IEEE Awards; exact cycle cadence/deadline not established on the award page | Bronze medal, certificate, and honorarium; **cash amount not stated** | Latest completed recipient **not established** in the accessible award-page extract | [official IEEE award page](https://corporate-awards.ieee.org/award/ieee-robotics-and-automation-award/), accessed 20 Oct 2026; direct page was readable |
| **Japan Prize** / Japan Prize Foundation | Outstanding science/technology advancing peace/prosperity; fit depends on one of two rotating fields, not on “robotics” alone | Scientists/researchers worldwide; no stated early-career restriction | Annual, two fields; Foundation invites >14,000 scientists/researchers to nominate; Board decides | **JPY 100,000,000 per laureate** plus medal/certificate | **2026:** Cynthia Dwork (Electronics, Information and Communication); Shizuo Akira and Zhijian “James” Chen (Life Sciences) | [official prize/amount/process](https://www.japanprize.jp/en/prize.html); [official laureates-by-year](https://www.japanprize.jp/en/laureates_by_year.html); [field schedule](https://www.japanprize.jp/en/prize_fields.html) |
| **Millennium Technology Prize** / Technology Academy Finland | Globally useful technological innovation benefiting millions; fit requires demonstrated impact, not a lab demo | Individual/team, any nationality, active career; no self-nomination | Current 2027 cycle; organizations/individuals may nominate via portal; call closed 27 Feb 2026; cycle schedule must be checked each time | **EUR 1,000,000** | **2024:** Bantval Jayant Baliga, for power-semiconductor innovation | [official nomination criteria/status](https://millenniumprize.org/prize/make-a-nomination/); [official winners](https://millenniumprize.org/winners/); [official home/amount](https://millenniumprize.org/). Pages were directly retrievable in the revision pass |
| **Queen Elizabeth Prize for Engineering** / QEPrize Foundation | Groundbreaking engineering innovation of global benefit; robotics is explicitly in scope | Living person/team, international; no self/posthumous nomination; current headings say up to ten, while rules retain five-person wording | Current 2027 cycle: online nomination with three independent referees; call 13 Apr–26 Jun 2026; next-cycle status must be rechecked | **GBP 500,000 total** | **2026, Modern Neural Interfaces:** Alim Louis Benabid, Jocelyne Bloch, Grégoire Courtine, Graeme Clark, John Donoghue, Erwin Hochmair, Ingeborg Hochmair, Pierre Pollak, Blake Wilson | [criteria and 2027 milestones](https://qeprize.org/nominate/criteria); [rules/amount](https://qeprize.org/nominate/prize-rules); [official winners](https://qeprize.org/winners). Team-size conflict preserved; contact Foundation before nominating |
| **Early Academic Career Award in Robotics and Automation** / IEEE RAS | Identifiable academic robotics/automation contribution with major impact; nearer-term field recognition, not a research target | RAS member; fewer than seven years after highest degree at nomination close, per checked page | Annual presentation at ICRA; society nomination route; live deadline not established here | Not established | 2026 entry existed; recipient not retained because direct page access returned 403 | [official award page](https://www.ieee-ras.org/awards-recognition/society-awards/early-academic-career-award-in-robotics-and-automation/); verify every live-cycle field manually |
| **IEEE ICRA Most Influential Paper Award** / IEEE RAS | Retrospective evidence of durable influence from an ICRA paper | Authors of a paper in the 18–22-year eligibility window | Annual at ICRA; nomination/selection route and current deadline not established in accessible extract | Not established | 2026 entry existed; exact recipient not established | [official award page](https://www.ieee-ras.org/awards-recognition/society-awards/ieee-international-conference-on-robotics-and-automation-most-influential-paper-award/) |

Other route-specific signals: the [IEEE/IFR Innovation and Entrepreneurship Award](https://www.ieee-ras.org/awards-recognition/society-awards/ieee-ifr-innovation-and-entrepreneurship-award-iera/) for commercial translation, the [Pioneer in Robotics and Automation Award](https://www.ieee-ras.org/awards-recognition/society-awards/pioneer-in-robotics-and-automation-award/) for mid/late-career field creation, and the [Joseph F. Engelberger Robotics Awards](https://www.automate.org/robotics/engelberger/joseph-f-engelberger-awards) for industry technology/application/leadership. Their mutable amounts/latest recipients were not established from directly accessible official pages, so they are monitoring references, not milestones in the 24-month plan.

**[JUDGMENT]** These reward different things and are lagging indicators: foundational algorithms map to Turing criteria; identifiable robotics contributions to the IEEE field award or, later, the Pioneer award; engineering systems with global benefit to QEPrize or the Millennium prize; domain breakthroughs to the Japan Prize in a designated field or, only when the underlying science qualifies, a Nobel domain; commercialization to IERA or Engelberger. **Nearer-term milestones that are not Nobel stature but are real:** a reproduction others trust, best-paper-quality evidence at a workshop or venue, benchmark adoption, open-source reuse, a doctoral fellowship, and an early-career field award after the work exists. None is promised.

---

## 19. Methodology, cross-checks, conflicts, and limitations

### 19.1 How this report was built

Six evidence dossiers were researched in parallel on 20 October 2026 (field/frontier; reading; curriculum/media; stack/projects/budgets/Indian law; plans/career/monitoring; prizes), each with a local ledger. Two independent reviews then challenged executable assumptions, legal currency, hours, procurement, citations, and learner-rule consistency. This revision narrows claims and links a deduplicated [master high-risk claim/source ledger](physical-ai-roadmap-research-2026/claim-source-ledger.md). Discovery used OpenAlex, Crossref, arXiv, Semantic Scholar, and targeted web discovery; verification preferred final proceedings/DOIs, official course/book/software records, Gazette/India Code/Ministry material, and official prize pages. A paper, its repository, project page, and lab post remain one evidence family.

**Revision checks through 21 October 2026, 03:26 UTC:** the Gazette commencement PDF for S.O. 5646(E) and the Ministry's “Our Performance” page independently established the 1 January 2025 transition; official G.S.R. 843(E)/846(E), India Code, and MeitY records established the DPDP phases. The second evidence audit disproved the earlier `safe-control-gym` `v0.6.0` claim: immutable commit `81bec94` is package 0.5.0/Python 3.8-era and lacks the attributed command and checkpoint. That claim was withdrawn. GitHub API and immutable source inspection then verified `v1.0.0`/`dd1b293`; a disposable CPU environment produced a **single-machine smoke observation with a partial manifest** for its 2-D PPO README arguments with only a headless plotting setting plus disclosed dependency/build fixes. Section 11.5 records selected dependencies, hashes, outputs, time, storage, installation failures, licences, and the Figure-5/6 mapping, but no complete lock or raw run artifact is linked. This local check used only artifacts published before the report cutoff and is not evidence of a post-cutoff release or a full-paper reproduction. Crossref and official RSS pages rechecked canonical metadata and abstract locators for the audited frontier claims; PyPI release records confirmed that every resolved smoke-test package named in §11.5 predated the 20 October cutoff. `nvidia-smi` remained unavailable, so no Diffusion Policy scientific run or integrated ROS/Gazebo/PX4 run is claimed. URL reachability and an artifact smoke observation are not scientific validation.

**Orchestrator-directed reviewer corrections, 20 October 2026:** EA-R3-001 through EA-R3-003 were applied using the reviewer's action text: the CPU result is bounded as a single-machine smoke observation with a partial manifest, both zero-event bounds now state their statistical scope and sources, and SHREC access/licence conditions are explicit.

### 19.2 Cross-checks that agree across independent dossiers

- ECB rate (EUR/USD 1.1215; EUR/INR 106.4590) and the derived ₹94.9255 per USD: two dossiers, identical arithmetic.
- ROS 2 Jazzy released 23 May 2024 (EOL May 2029) and Lyrical Luth released 22 May 2026 (EOL May 2031): curriculum and stack dossiers, same official source.
- Jazzy + Gazebo Harmonic as the documented new-user pairing; Humble/22.04 as PX4's and ArduPilot's documented ROS 2 target: stack dossier from both projects' official docs (independent projects agree).
- NPTEL 2026 runs: free to learn, optional ₹1,000 certificate exams, registration closed at the cutoff; several exams scheduled 23 October 2026 (after the cutoff) and not treated as completed.
- VLA robustness gap: LIBERO-X (RSS 2026), the 19 October 2026 critical review, and the ActiveAlign preprint are three independent families.
- Frontier openness for F1, F3, F4, F6, F8, F11: each rests on at least two independent families (§6).
- Bharatiya Vayuyan Adhiniyam commencement: Gazette S.O. 5646(E) and the Ministry performance page agree on 1 January 2025.
- DPDP phased status: Gazette G.S.R. 843(E) and G.S.R. 846(E), India Code, and MeitY identify the November 2025 immediate provisions and the scheduled 13 November 2026 / 13 May 2027 phases; future phases are not treated as operative.
- CPU artifact boundary: immutable `safe-control-gym` `v1.0.0`/`dd1b293` contains the named command, evaluator, YAML files, and checkpoint; the local one-episode result is a **single-machine smoke observation with a partial manifest**. The paper's Figures 5–6 define the result family and metrics, while the README performance table measures random-action simulator throughput. A checkpoint health check is not a full-paper reproduction.
- Diffusion Policy boundary: immutable README, environment file, and Push-T source agree on PyMunk, legacy Python/PyTorch/CUDA, and NVIDIA commands. These are one author family, so they establish artifact requirements, not independent performance.
- Nobel categories, statutes, and historical examples: official Nobel pages checked individually.

### 19.3 Conflicts preserved (not resolved by averaging)

1. **PX4 v1.17.0 date:** release page 13 May 2026; release Atom feed 14 May 2026 (time-zone difference likely).
2. **Digital Sky legacy address:** one check saw a redirect to the AAI portal; another saw an expired TLS certificate. Use `digitalsky.aai.aero` and never bypass a certificate warning.
3. **PyTorch version signals:** PyPI 2.14.1 versus the official selector's "Stable 2.7.0". Pin and hash.
4. **`safe-control-gym` artifact identity:** GitHub release `v1.0.0` points to commit `dd1b293`, while that commit's `pyproject.toml` declares package 2.0.0 and a mutable `poetry-core` build backend. The report names all three and treats the partial smoke environment as a disclosed deviation, not a canonical lock.
5. **Original AirSim:** repository unarchived with 2026 housekeeping commits versus Microsoft's no-further-updates notice and a 2022 binary. Treated as legacy.
6. **Coursera Modern Robotics access:** structured metadata said "accessible for free" while the visible path was subscription-based. Free Northwestern route is primary.
7. **Robot Control Lecture (2025) lecturer spelling:** "M. Sodano" in five titles, "M. Sondano" in one.
8. **QEPrize 2027 cycle:** open-versus-closed status and five-versus-ten team size conflict across official pages.
9. **Data recipe for generalist policies:** the TRI co-training study (cross-embodiment co-training helps) versus Ψ0 (curated egocentric plus small robot data beats 10× heterogeneous data) — different embodiments and protocols; both retained.
10. **Benchmark adequacy:** VLA papers report headline numbers on LIBERO/SimplerEnv/CALVIN while LIBERO-X and the 2026 review judge those benchmarks insufficient; any such number carries that caveat here.
11. **18.03 identity:** the curriculum dossier cites MIT OCW 18.03 Spring 2010 (Miller and Mattuck); the plan dossier cites the self-paced 18.03SC Fall 2011; both are live, and this report uses Spring 2010 with 18.03SC as the self-paced alternative.

### 19.4 Access failures and what they mean

ISO landing pages and the Online Browsing Platform (403): the robot definition rests on the IFR page. ICAO UAS pages (403): international UAS definitions not verified. IEEE Xplore and some IEEE RAS pages (403/418): paper identity rests on Crossref/final DOI records; where an award page was not directly readable, §18.3 says `not established` for mutable amount/recipient fields rather than relying on the dossiers' unnamed text rendering. docs.ros.org rendered pages showed an anti-bot challenge, so official repository source was used. SAGE, ACM, Science, MDPI, Wiley, and AIAA article pages sometimes returned 403; metadata came from Crossref/official PDFs, with access level stated. OpenReview API (403): DINO-WM's venue remains unverified. The neuromorphic-flight erratum could not be read, so its numbers stay uncertain. A-Lab/materials comments were not exhaustively checked, so no novelty superlative is adopted. Project pages for RoboMIND and the current EuRoC host were not located.

### 19.5 Limitations that survive into use

- The substantive evidence horizon is 20 October 2026; the short post-midnight verification only checked material already published by that date. CoRL 2026 (9–12 November), NeurIPS 2026, CDC 2026 (15–18 December), and all 2027 events were incomplete or future; CoRL 2026 items are accepted-list records, not final proceedings.
- Frontier claims identify final/preprint status, dates, and access level inline. Several 2026 numbers remain official-abstract-only and are labeled uncertain; do not promote them into a manuscript without checking the full table/appendix and protocol.
- Hardware figures are single-vendor foreign statements or unquoted planning allowances, not independently supported prices or Indian landed budgets. Authorized Indian stock, written landed quotes, GST/customs/brokerage, and product-specific DGFT/WPC status remain unresolved. **Scenarios B and C are both not orderable**; landed INR cost is not established. The parent aviation Act's 1 January 2025 commencement is resolved; concrete enforcement still requires current professional advice. DPDP application remains phased and fact-specific.
- The main ROS/Gazebo/PX4 stack is **documented-compatible, not integration-tested**. Exact apt packages, compiler, RMW, `ros_gz`, container digest, and PyTorch wheel remain for the user's smoke test. Separately, one isolated `safe-control-gym` CPU checkpoint command produced the §11.5 single-machine smoke observation with a partial manifest and disclosed deviations; this does not validate the integrated stack or full paper. Diffusion Policy's author profile was not run and has no established VRAM/runtime/cloud-cost figure.
- Course hosting, graded access, and reruns can change; no 2027 NPTEL run or Science Academies fellowship cycle is inferred.
- Program pages establish that a route exists, not eligibility, funding, or admission.
- Nothing here promises a publication, acceptance, fellowship, job, or award.

### 19.6 Next verification dates

Recheck the stack, prices, and Indian legal sources immediately before any purchase, import, registration, radio use, or flight, and otherwise by **20 January 2027**; sooner when ROS 2 Kilted reaches EOL in December 2026, when Gazebo Ionic reaches EOL in December 2026, when a final record appears for π0.5 or code appears for LIBERO-X or Motion Planning Diffusion, when CoRL 2026 or NeurIPS 2026 proceedings publish, or when any DGCA, AAI, MoCA, DGFT, or DoT notice changes.

---

## Appendix A. Documented compatibility matrix, **not integration-tested** (checked 20 October 2026)

A version shown here establishes source identity or upstream pairing only. Blank/unresolved package pins must be filled by the §11.2 smoke test before experimental use.

| Component | Pinned version | Release date | Support/EOL | Platform notes | Licence |
|---|---|---|---|---|---|
| Ubuntu | 24.04 LTS | — | — | Tier 1 for ROS 2 Jazzy; supported by Gazebo Harmonic | — |
| ROS 2 | Jazzy Jalisco | 23 May 2024 | May 2029 | Ubuntu 24.04 amd64/arm64, Windows 10 amd64 Tier 1 | Package-specific |
| ROS 2 (evaluation only) | Lyrical Luth | 22 May 2026 | May 2031 | Ubuntu 26.04, Windows 11; Gazebo Jetty; C++20; Python 3.12–3.14 | Package-specific |
| ROS 2 (autopilot DDS profile) | Humble Hawksbill | — | May 2027 | Ubuntu 22.04; PX4 and ArduPilot documented target | Package-specific |
| Gazebo | Harmonic (gz-sim 8) | September 2023 | May 2029 | Ubuntu 22.04/24.04 amd64 official; ARM/Windows/macOS best-effort | Apache-2.0 |
| MuJoCo | 3.16.0 | 14 October 2026 | — | Linux x86-64/AArch64, Windows, macOS; Python ≥3.10 | Apache-2.0 |
| PyTorch | Project-pinned wheel (record hash) | — | — | Python 3.12; PyPI showed 2.14.1, selector showed 2.7.0 | BSD-style |
| PX4 Autopilot | v1.17.0 | 13 May 2026 (feed: 14 May) | — | Ubuntu 24.04/22.04 setup script; modern Gazebo SITL | BSD-3-Clause |
| QGroundControl | v5.1.5 | 1 October 2026 | — | Windows 10/11, macOS 14.4+, Ubuntu 24.04/26.04, Android 9+ | Apache-2.0 / GPL-3.0 dual |
| Isaac Sim / Isaac Lab (optional) | 6.2.0 / v3.0.0 | October 2026 / 20 October 2026 | — | RTX 4080 16 GB minimum; Ubuntu 22.04/24.04 or Windows 11 | Proprietary / BSD-3-Clause |
| ArduPilot (alternative) | Plane-4.7.2 (Plane stream) | 14 October 2026 | — | Gazebo plugin recommends Harmonic on Ubuntu 22.04; ROS 2 Humble only | GPL-3.0 / LGPL-3.0 plugin |
| Betaflight (niche) | 2026.6.2 | 16 September 2026 | — | SITL available | GPL-3.0 |
| Project AirSim (IAMAI) | v1.0.1 | 7 September 2026 | — | Ubuntu 22.04, ROS 2 Humble, UE 5.2/5.7/5.8 | MIT |
| Webots | R2025a | 4 February 2025 | — | Linux, Windows, macOS | Apache-2.0 |
| PyBullet | 3.25 tag / PyPI 3.2.7 | 24 April 2022 / 30 January 2025 | Issue tracker closed | pip; no native ROS 2 | zlib |
| Crazyflie firmware / cflib / Crazyswarm2 | 2026.08 / 0.1.34 / community | 20 August 2026 / 30 September 2026 / — | — | Crazyswarm2 CI: Humble, Jazzy, Lyrical, Rolling | GPL-3.0 / GPL-2.0+ / MIT |
| MAVSDK (optional external PX4 API) | v4.0.6 | 8 October 2026 | — | Release verified; full-profile interoperability not tested | BSD-3-Clause |
| `safe-control-gym` artifact profile | release `v1.0.0`, commit `dd1b293`; package declares 2.0.0 | commit 5 May 2024; release 21 October 2024 | — | Python ^3.10, Torch ^1.10.2, Gymnasium ^0.28, CasADi ^3.6, PyBullet ^3.2. One Windows CPU smoke passed with disclosed conda/build-backend/setuptools deviations; 4.607 s for one 250-step randomized episode; 2.424 GiB environment; checkpoint SHA-256 in §11.5. Not a full-paper reproduction. | MIT repository; dependency licences separate |
| Diffusion Policy paper profile | commit `5ba07ac` | commit 24 December 2024 | — | Python 3.9, PyTorch 1.12.1, CUDA 11.6, PyMunk 6.2.1; NVIDIA GPU; preflight failed because `nvidia-smi` was unavailable, so no scientific run | Repository licence must be checked per file/project |
| Nav2 | Distro-resolved; candidate tags 1.5.3 / 1.3.14 | 17 October 2026 candidate releases | — | Exact ROS-distribution mapping was not integration-tested; resolve and record from apt/release docs before Rung 3 | Apache-2.0 |

## Appendix B. FX and budget arithmetic

Rate: `2026-10-20` row, 106.4590 / 1.1215 = 94.925546 INR per USD ([ECB full historical XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml)). Scenario B vendor-stated foreign goods: 320 + 10.50 + 6.50 = USD 337 → ₹31,990 by arithmetic; adding USD 100 of unquoted safety allowances gives USD 437 → ₹41,482. Scenario C mobile vendor statements: 783.50 + 269 = USD 1,052.50; plus USD 200 unquoted controls = USD 1,252.50 → ₹118,894. Manipulation: 1,629.09 + 269 = USD 1,898.09; plus USD 200 controls = USD 2,098.09 → ₹199,162. Optional vendor-announced Jetson +249 yields USD 1,501.50 → ₹142,531 or USD 2,347.09 → ₹222,799. Scenario D's USD 2,000 → ₹189,851 is a planning cap. The arithmetic is checked; the prices are single-vendor and uncorroborated. **Scenarios B and C are illustrative, not orderable; landed INR cost is not established** because stock, GST, customs, brokerage, shipping, warranty, and product-specific import/radio status lack written Indian evidence.

## Appendix C. Glossary

ATE absolute trajectory error · BC behavior cloning · CBF control barrier function · CI confidence interval · DDS Data Distribution Service (ROS 2 middleware) · EKF extended Kalman filter · HIL hardware-in-the-loop · IL imitation learning · LoRA low-rank adaptation (parameter-efficient fine-tuning) · LQR linear quadratic regulator · MAVLink/MAVSDK autopilot messaging protocol and SDK · MPC model predictive control · NEES/NIS normalized estimation/innovation error squared (filter consistency tests) · OOD out-of-distribution · QoS quality of service (ROS 2 reliability/durability settings) · RPAS remotely piloted aircraft system · RSS Robotics: Science and Systems (conference) · SE(3)/SO(3) rigid-body pose and rotation groups · SIL/SITL software-in-the-loop · SLAM simultaneous localization and mapping · SPL success weighted by path length · UIN unique identification number (Indian drone registration) · ULog PX4 flight log format · VIO visual-inertial odometry · VLA vision-language-action model · VLM vision-language model.

## Appendix D. Dossier verification windows and ledger locations

| Dossier (all in `ahead/.agents/tasks/physical-ai-roadmap-research-2026/`) | Window (UTC, 20 October 2026) | Ledger prefix |
|---|---|---|
| `field-frontier-evidence.md` | 18:47–19:12 | FF-S001–FF-S140; FF-C001–FF-C045 |
| `reading-list-evidence.md` | 18:47–19:20 | RL-S001–RL-S036; RL-C001–RL-C010 |
| `curriculum-media-evidence.md` | 18:47–20:42 | CM-S001–CM-S047; CM-C001–CM-C017 |
| `stack-projects-india-evidence.md` | 18:47–19:25 | SP-, HW-, FX-, IN- sources; SP/HW/IN claims |
| `plan-monitoring-career-evidence.md` | 18:47–19:22 | Inline verification notes |
| `prizes-aspiration-evidence.md` | 18:48–19:03 | PA-S001–PA-S035; PA-C001–PA-C012 |

The governing plan is [`research-plan.md`](physical-ai-roadmap-research-2026/research-plan.md). The deduplicated high-risk evidence map and consolidated rejection/scorecard notes are in [`claim-source-ledger.md`](physical-ai-roadmap-research-2026/claim-source-ledger.md). Independent findings that drove this revision are in [`evidence-audit.md`](physical-ai-roadmap-research-2026/evidence-audit.md) and [`coverage-audit.md`](physical-ai-roadmap-research-2026/coverage-audit.md). These audit files support traceability; this report remains self-contained. No application code, configuration, package, generated data, or Git state was changed, and no Git command was run.
