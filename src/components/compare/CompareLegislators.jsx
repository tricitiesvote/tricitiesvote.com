import React from 'react';
import { StrongA, LeanA, LeanB, StrongB } from '../statements';
import {
  BradKlippert,
  BrettBorden,
  CarlyCoburn,
  DanielleGarbeReser,
  FrancesChvatal,
  LarryStanley,
  MarkKlicker,
  MaryDye,
  MattBoehnke,
  PerryDozier,
  ShirRegev,
  SkylerRude,
} from '../candidates';

const CompareLegislators = props => {
  const { office } = props;

  let classes = office;

  if (office !== 'all') {
    classes = office;
  } else {
    classes = 'ld8rep1 ld8rep2 ld9rep1 ld16rep1 ld16rep2 ld16senator';
  }

  return (
    <table className={classes}>
      <tbody>
        <tr className="key">
          <th>A</th>
          <th>
            Strongly
            <br /> lean A
          </th>
          <th>
            Slightly
            <br /> lean A
          </th>
          <th>
            Slightly
            <br /> lean B
          </th>
          <th>
            Strongly
            <br /> lean B
          </th>
          <th>B</th>
        </tr>
        <tr>
          <th>
            <p>
              In the face of dramatically decreased revenue from COVID-19’s
              impact on the economy, we should empower local businesses with tax
              breaks and deregulation to reinvigorate the economy.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BrettBorden says="My concern with stimulus packages for businesses is the tendency for them to favor big businesses that don't need it while leaving independents in the rain and the people holding the check." />
            <MaryDye spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <DanielleGarbeReser says="Businesses and our local economies need stimulus support to recover from an economic catastrophe of this scale." />
            <FrancesChvatal says="State and local governments should work together to assess needs and decisions must be considered in light of current revenue reports and the impact of a CARES 2 package" />
          </LeanB>
          <StrongB>
            <CarlyCoburn />
            <LarryStanley />
            <ShirRegev says="The surplus was created for these difficult times. Using these funds to cover needed improvements to our infrastructure creates jobs and paves the way to resume more robust business as we recover." />
          </StrongB>
          <th>
            <p>
              In the face of dramatically decreased revenue from COVID-19’s
              impact on the economy, we should encourage state-wide economic
              growth with stimulus packages and infrastructure spending.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              COVID-19 is a once-in-a-generation sea change. We should shore up
              the damage using the state’s Rainy Day Fund, and prepare our
              budget for a ‘new normal.’
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
            <ShirRegev says="Please see the above answer. I will add that by helping keep Washington families afloat now, it will save the state more money in the long term by preventing a run on assistance programs." />
          </StrongA>
          <LeanA>
            <BrettBorden says="Given the large increase in the State budget over the past decade I don't trust Olympia to ever balance the budget. They keep spending more and asking for more even with massive cannabis revenues." />
            <CarlyCoburn />
            <DanielleGarbeReser says="COVID-19 has resulted in significant budgetary changes.  We may need to rely partially on our reserves, but that will not be enough alone to adapt to the challenges we face in the future. " />
            <LarryStanley />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <FrancesChvatal says="Decisions must be considered in light of current revenue reports and the impact of a CARES 2 package" />
          </LeanB>
          <StrongB>
            <BradKlippert />
            <PerryDozier spec="true" dnr="true" />
          </StrongB>
          <th>
            <p>
              The economic hit from COVID-19 is just a bump in the long road
              towards a balanced budget. We’ve prepared for this, and should not
              be making drastic changes to the Washington budget.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Governor Inslee should call a special legislative session to
              address foreseen state budget deficits as soon as possible.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <DanielleGarbeReser says="I agree with Republicans that we should have a special session to start this work as soon as possible." />
            <MarkKlicker />
            <MaryDye spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <FrancesChvatal says="Decisions must be considered in light of current revenue reports and the impact of a CARES 2 package." />
            <LarryStanley />
          </LeanA>
          <LeanB>
            <CarlyCoburn />
            <ShirRegev says="Governor Inslee took steps to ensure the state budget would last until the next session.  This also allows us to see how bad the deficit will be.  It makes sense to only meet once instead of twice right now." />
          </LeanB>
          <StrongB>
            <BrettBorden />
          </StrongB>
          <th>
            <p>
              The legislative branch works best when we have big, inclusive
              stakeholder processes followed by public hearings, talking to
              constituents in groups big and small; this is unwise in the
              context of the current public health crisis.{' '}
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              By incentivizing manufacturing, health care, and agricultural
              industries in our state, we create a competitive job market, and a
              vibrant creative economy will occur naturally.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <CarlyCoburn />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BrettBorden />
            <DanielleGarbeReser says="We need all of these sectors to be strong for our communities to be thriving, vibrant places to live and work." />
            <LarryStanley />
          </LeanA>
          <LeanB>
            <FrancesChvatal />
            <ShirRegev says="If you want to attract and retain the best minds, there needs to be something to do outside of work. A thriving arts scene does this and also helps draw tourists to our region to spend their money here." />
          </LeanB>
          <StrongB />
          <th>
            <p>
              Direct funding for the Arts, Cultural Activities, and STEM yield
              immediate economic benefit to our state, and help our communities
              retain high-quality professionals.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>Police should be fully funded.</p>
          </th>
          <StrongA>
            <BradKlippert />
            <MarkKlicker />
            <MaryDye spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <DanielleGarbeReser says="Our communities value security. Everyone deserves fair and equitable treatment by law enforcement. We need to prioritize community engagement and hold our police to high but fair standards." />
            <SkylerRude spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <FrancesChvatal />
          </LeanB>
          <StrongB>
            <BrettBorden />
            <CarlyCoburn />
            <LarryStanley />
            <ShirRegev says="We are seeing this play out in real time where departments are asking for more money to deal with mental health calls. Doesn't it make sense then to get more social workers?" />
          </StrongB>
          <th>
            <p>
              Too much is asked of our police; some responsibilities and
              resources should be shifted to health and social workers and new
              programs.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Police officers’ skill set and training are often out of sync with
              the social interactions that they have with their local
              communities.
            </p>
          </th>
          <StrongA>
            <BrettBorden />
            <CarlyCoburn />
          </StrongA>
          <LeanA>
            <FrancesChvatal />
            <LarryStanley />
            <ShirRegev />
          </LeanA>
          <LeanB>
            <DanielleGarbeReser says="We can always improve training building off the standards for accredited police programs." />
            <SkylerRude spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <BradKlippert />
            <MarkKlicker />
            <PerryDozier spec="true" dnr="true" />
            <MaryDye spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
          </StrongB>
          <th>
            <p>
              Police officer training programs develop a culture of learning,
              critical thinking, open-mindedness, tolerance, and healthy
              curiosity.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              The Washington State COVID policy should be based on the
              recommendations of public health officials.
            </p>
          </th>
          <StrongA>
            <CarlyCoburn />
            <DanielleGarbeReser says="We need to lead with the data, science, and experts, who tell us to mask up so we can open up." />
            <FrancesChvatal />
            <ShirRegev />
          </StrongA>
          <LeanA>
            <LarryStanley />
            <SkylerRude spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <BrettBorden says="Public entities should consult health officials, but private entities should be able to do what is necessary for their livelihoods unencumbered by the State." />
            <MarkKlicker says="We can both open ours businesses while utilizing guidelines from our health officials" />
          </LeanB>
          <StrongB>
            <BradKlippert />
            <MaryDye spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongB>
          <th>
            <p>
              The economic stakes are too high for health officials’ input to
              dominate the decision making process. It’s time to end
              restrictions and fully open up our schools and businesses.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Decisions about public safety are best made by local communities,
              private businesses, and municipalities, who are most aware of
              their own local needs.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <BrettBorden />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <ShirRegev says="Surprise! I do feel local communities have the largest stake in making things succeed. The state should be able to step in though where there is a noticeable downward trend." />
            <SkylerRude spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <DanielleGarbeReser says="The state should set standards and local communities should have flexibility to respond to local needs." />
            <LarryStanley />
            <MaryDye spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <CarlyCoburn />
            <FrancesChvatal says="I believe that decisions about public safety should be made by the Health authorities at the state and county level.  Both should strive to work together for the common good." />
          </LeanB>
          <StrongB />
          <th>
            <p>
              Decisions about public safety are best made at the state level,
              where resources of the entire state can be used to benefit
              everyone and coordinate intra-community needs with a bird’s eye
              view, taking the heat off of local politicians, who have other
              challenges to deal with in leading communities through these
              challenges.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Washington State’s current ‘Top 2 in the Primary’ voting system
              satisfies the needs of the community. Unnecessarily changing or
              complicating the existing voting system would only cause confusion
              and voter exhaustion.
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB />
          <StrongB>
            <BrettBorden says="I support reforms like RCV in order to better represent the will of voters, and am the only candidate running in the 9th district to be recognized by FairVote Washington for this advocacy." />
            <CarlyCoburn />
            <DanielleGarbeReser says="The Governor’s primary race was an example of the disenfranchisement that happens to voters whose candidate is not picked.  I support exploring other options like ranked choice voting." />
            <LarryStanley />
            <ShirRegev says="Top 2 Primaries are the most damaging thing to have happened to our elections in recent years.  On the premise of saving a drop in the state budget bucket we have been robbed of real choices during the election cycle." />
          </StrongB>
          <th>
            <p>
              Washington State’s ‘Top 2 in the Primary’ voting system was a step
              in the right direction in 2004, but we need to take the next leap
              forward on election reform, where candidates win by majority, not
              by mere plurality (e.g. with Ranked Choice, or Instant Runoff
              voting systems).
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              More state funding for education is needed to cope with COVID-19.
            </p>
          </th>
          <StrongA>
            <CarlyCoburn />
            <ShirRegev says="Re-directing school levy funds significantly impacts those who have the most to lose. Rainy day funds exist for a reason. Supplementing schools to protect our children and their teachers is a worthy use of those dollars." />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <DanielleGarbeReser says="Many of our districts have increased costs from providing online learning that need to be addressed now. I want our districts to have more flexibility with their levies in the future." />
            <FrancesChvatal says="I do not believe this is a either/or depending on the community and their needs" />
            <MarkKlicker />
          </LeanA>
          <LeanB>
            <BrettBorden />
            <LarryStanley />
          </LeanB>
          <StrongB>
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongB>
          <th>
            <p>
              School districts should be allowed to supplement more of their
              funding with levies.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Cutting educational service provider (ESP) jobs is shortsighted
              and harmful to students.
            </p>
          </th>
          <StrongA>
            <CarlyCoburn />
            <DanielleGarbeReser says="We need to maintain supports in our schools, particularly for students with special education needs." />
            <FrancesChvatal says="I would defer to precedent and the constitution to determine any decrease in educational spending.  I also, very much support emergency and public health services." />
            <ShirRegev says="Using COVID-19 as an excuse to curtail union agreements with support staff is cynical. These employees provide invaluable services to our schools.  Their union wages are what is keeping their own families afloat." />
          </StrongA>
          <LeanA>
            <LarryStanley />
          </LeanA>
          <LeanB>
            <BradKlippert />
            <BrettBorden />
            <MarkKlicker />
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanB>
          <StrongB />
          <th>
            <p>
              While COVID-19 is impacting communities now, it is important to
              remain prepared for future crises and maintain funding for
              emergency reserves.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              {' '}
              It is the responsibility of local school districts and the voters
              therein to decide its annual budget.
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <BrettBorden says="I am generally supportive of more local control over education and school choice, though recognize that funding this way can open the door to disparate results based on geography and wealth." />
            <DanielleGarbeReser says="Post the McCleary decision we are at better parity.  Our focus going forward needs to be on the flexibility our communities want to pass the levies that make sense for each district." />
            <MarkKlicker />
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <CarlyCoburn />
            <FrancesChvatal />
            <LarryStanley />
          </LeanB>
          <StrongB>
            <ShirRegev says="As evidenced by McCleary, the Legislature has neglected funding schools at a level that provides our students with the level of education they need to be the next generation of Washington success stories." />
          </StrongB>
          <th>
            <p>
              The state has perpetually underfunded schools. State-level tax
              revenue should be used to provide equity among its districts.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Climate change is not an issue that states can or should address.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <MarkKlicker />
            <MaryDye spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <BrettBorden />
          </LeanB>
          <StrongB>
            <CarlyCoburn />
            <DanielleGarbeReser says="Washington State has always been a leader.  We should lead in creating and attracting the clean energy jobs and businesses of the future, like Moses Lake is doing with its new solar business." />
            <FrancesChvatal />
            <LarryStanley />
            <ShirRegev says="We need to accept climate change is real.  Instead of pretending it's not happening let's take the opportunity to become leaders in the manufacture of clean solutions." />
          </StrongB>
          <th>
            <p>
              I support climate policies that incentivize Washington to do its
              part to prevent climate change.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              We have an abundance of open, natural spaces and we need to focus
              on economic development over conservation or sustainability.
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <MarkKlicker />
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <BrettBorden says="I support opening up public lands to an even greater extent and devolving control to the people for common usage. After all, it is our public land." />
            <DanielleGarbeReser says="Our region can’t grow without maintaining sustainable, clean water sources for agricultural, manufacturing, residential, and recreational use." />
            <LarryStanley />
          </LeanB>
          <StrongB>
            <CarlyCoburn />
            <FrancesChvatal />
            <ShirRegev />
          </StrongB>
          <th>
            <p>
              The natural environment is crucial to quality of life and economic
              prosperity. We should prioritize protecting it.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              I will make the best decision I can based on my experience,
              judgment, and beliefs.
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <BrettBorden says="While I am running on a platform dedicated to individual liberties and will not stray from this commitment, it is important to be able to listen and discuss issues with anybody and be open to what they are saying." />
            <MarkKlicker says="It's important to seek opinions and perspectives from others and I will do just that.  However my decisions will be made based upon the needs and concerns of the people in the district." />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <CarlyCoburn />
            <DanielleGarbeReser says="I will bring my experience as an Eastern Washingtonian to the legislature and will keep an open mind to listen to all sides and use data, science, and experts to finalize my views." />
            <FrancesChvatal />
            <MattBoehnke spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <LarryStanley />
            <ShirRegev says="You can't say you have made an informed decision if you haven't sought out multiple perspectives.  Part of the crisis of democracy we find ourselves in is the result of myopic leadership. " />
          </StrongB>
          <th>
            <p>
              I will seek opinions and perspectives different from my own when
              formulating a decision.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              State legislature dedicates a large amount of resources to ensure
              healthy communication, and works hard at educating the public on
              how to use what exists.
            </p>
          </th>
          <StrongA />
          <LeanA>
            <BradKlippert />
            <BrettBorden />
            <FrancesChvatal />
            <MattBoehnke spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <DanielleGarbeReser says="Communication must improve. Even with funding limitations in this budget cycle, we can use free methods to connect with more residents." />
            <MarkKlicker />
            <SkylerRude spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <CarlyCoburn />
            <LarryStanley />
            <ShirRegev />
          </StrongB>
          <th>
            <p>
              Communication methods used by state legislators are out-dated and
              underfunded. Funding for upgrades to, and person-power to support,
              the existing systems is critical.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              The state transportation budget should focus on road maintenance,
              repairs, and expansion to reduce congestion.
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BrettBorden says="Transportation is one of these areas where we throw increasing gobs of money at the problem with little to show for it. While (A) is important, we have not been getting our money's worth and that must be examined." />
            <DanielleGarbeReser says="In the 16th LD, we have major repair and infrastructure needs that need to take priority in a tough budget environment." />
            <CarlyCoburn />
            <SkylerRude spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <FrancesChvatal />
            <LarryStanley says="There should be a some of each. All infrastructure should be updated for safety and efficiency." />
            <ShirRegev says="It’s hard not to drive when a 10 minute drive takes over an hour by bus. I'll work to find which revenue streams are available to help increase the frequency of buses so folks are more willing to leave the car at home." />
          </LeanB>
          <StrongB />
          <th>
            <p>
              The state transportation budget should focus on supporting
              carbon-free charging/fueling, and on increasing the use of
              carpooling, mass transit, and bicycles.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              I stand with 70% of those surveyed in support of the{' '}
              <a href="http://leg.wa.gov/JTC/Meetings/Documents/Agendas/2020%20Agendas/Jun%2023%20Meeting/DraftFinalReport_EastWestPassengerRail.pdf">
                proposed passenger rail system
              </a>{' '}
              that increases inter-connectivity between Southeastern WA and the
              rest of the State, while reducing carbon emissions.
            </p>
          </th>
          <StrongA>
            <CarlyCoburn />
          </StrongA>
          <LeanA>
            <DanielleGarbeReser says="I am really interested in learning more about high speed rail options that include Eastern Washington." />
            <FrancesChvatal says="This is a proposal that I would need to thoroughly review and study. We must invest and create systems for many years into the future and view through the prism health, both humanity and the earth" />
            <LarryStanley />
            <ShirRegev />
          </LeanA>
          <LeanB>
            <BradKlippert />
            <BrettBorden />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <SkylerRude spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanB>
          <StrongB />
          <th>
            <p>
              The{' '}
              <a href="http://leg.wa.gov/JTC/Meetings/Documents/Agendas/2020%20Agendas/Jun%2023%20Meeting/DraftFinalReport_EastWestPassengerRail.pdf">
                proposed passenger rail system
              </a>{' '}
              comes at too high an upfront cost. The state has higher priorities
              for its transportation budget, and I support focused funding on
              the interstate road system.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              The state has a role to play in cost of living and affordable
              housing.
            </p>
          </th>
          <StrongA>
            <CarlyCoburn />
            <FrancesChvatal />
            <LarryStanley />
            <ShirRegev says="A key factor in gaining stability is being able to maintain housing. In our community the ability to find an affordable place to live is out of reach for too many residents and it has not been addressed." />
          </StrongA>
          <LeanA>
            <DanielleGarbeReser says="We need the state to partner in rural areas to make construction more affordable and accessible. The state can also help support job programs in the trades that will make labor more available for construction." />
          </LeanA>
          <LeanB>
            <BradKlippert />
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <BrettBorden says="The key being that the market needs to actually be open. Heavy regulations like zoning block the construction of new housing and enables NIMBY elitism that leaves us with artificially restricted, expensive housing." />
            <MarkKlicker />
          </StrongB>
          <th>
            <p>
              Cost of living and housing affordability should be left solely to
              the market.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              We should control and guide suburban sprawl in our state even if
              doing so affects short-term economic growth.
            </p>
          </th>
          <StrongA>
            <LarryStanley />
          </StrongA>
          <LeanA>
            <CarlyCoburn />
            <FrancesChvatal />
            <ShirRegev says="What we need to do is make it attractive to developers to pursue high density, residential projects to revitalize our CBDs.  Having a vibrant, walk-able city center attracts young professionals and tourists." />
          </LeanA>
          <LeanB>
            <DanielleGarbeReser says="The state can provide guidance, but our local areas need to be the driving force behind what works for each county in partnership with our market players." />
            <SkylerRude spec="true" dnr="true" />
            <MattBoehnke spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <BradKlippert />
            <BrettBorden />
            <MarkKlicker />
            <PerryDozier spec="true" dnr="true" />
          </StrongB>
          <th>
            <p>
              We shouldn’t restrain free market development; it's critical to
              our local economies.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              We need to be cautious when it comes to going too far shaping our
              society in response to LGBTQ+ ‘identity politics.’
            </p>
          </th>
          <StrongA>
            <BradKlippert />
            <MarkKlicker says="I believe we are all equal and and no person of color, race or sexual identification should be discriminated against or given special privileges." />
            <MaryDye spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <SkylerRude spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <DanielleGarbeReser />
            <BrettBorden />
            <CarlyCoburn />
            <FrancesChvatal />
            <LarryStanley />
            <ShirRegev says="This district elects a man who makes it his life's work to legislate my community away. How do you think it makes any other member of the LGBTQ community feel when he advocates for discrimination from the House floor?" />
          </StrongB>
          <th>
            <p>
              We have taken positive steps forward in making our state more
              inclusive for LGBTQ+ and gender-nonconforming people, but there is
              still more progress that can be made at the state level to create
              a more equitable, just, and compassionate society for everyone.
            </p>
          </th>
        </tr>
        <tr>
          <th>
            <p>
              Racism is a real and unfortunate thing, but it is a personal
              matter. We have made good progress as a society in overcoming
              racism and we should not try to create legislation which may
              overreach in order to appease minority groups.
            </p>
          </th>
          <StrongA>
            <MaryDye spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradKlippert />
            <MarkKlicker />
            <MattBoehnke spec="true" dnr="true" />
            <PerryDozier spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <SkylerRude spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <BrettBorden says="Meaningful justice reform measures are my #1 priority." />
            <CarlyCoburn />
            <DanielleGarbeReser />
            <FrancesChvatal />
            <LarryStanley />
            <ShirRegev says="We saw it nationally with a President who told a known white supremacist hate group to 'Stand by.' and locally when all but two elected officials refused to denounce Defend the Tri." />
          </StrongB>
          <th>
            <p>
              Systemic racism is real and there are many things we must do at
              the state level to respond to the urgent challenge of creating a
              more just society.
            </p>
          </th>
        </tr>
      </tbody>
    </table>
  );
};

export default CompareLegislators;
