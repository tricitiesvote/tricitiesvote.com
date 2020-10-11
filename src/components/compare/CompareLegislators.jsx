import React from 'react';
import { StrongA, LeanA, LeanB, StrongB } from '../statements';
import {
  BradKlippert,
  BradPeck,
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
  SkylerRude
} from '../candidates';

const CompareLegislators = () => {
  
  return (
    <table>
    <tbody>
    <tr className="key">
      <th>A</th>
      <th>Strongly<br/> lean A</th>
      <th>Slightly<br/> lean A</th>
      <th>Slightly<br/> lean B</th>
      <th>Strongly<br/> lean B</th>
      <th>B</th>
    </tr>
    <tr>
      <th>In the face of dramatically decreased revenue from COVID-19’s impact on the economy, we should empower local businesses with tax breaks and deregulation to reinvigorate the economy.</th>
      <StrongA>
      <BradKlippert/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      <BrettBorden says="My concern with stimulus packages for businesses is the tendency for them to favor big businesses that don't need it while leaving independents in the rain and the people holding the check."/>
      </LeanA>
      <LeanB>
      <DanielleGarbeReser says="Businesses and our local economies need stimulus support to recover from an economic catastrophe of this scale."/>
      <FrancesChvatal says="State and local governments should work together to assess needs and decisions must be considered in light of current revenue reports and the impact of a CARES 2 package"/>
      </LeanB>
      <StrongB>
      <CarlyCoburn/>
      <LarryStanley/>
      <ShirRegev says="The surplus was created for these difficult times. Using these funds to cover needed improvements to our infrastructure creates jobs and paves the way to resume more robust business as we recover."/>
      </StrongB>
      <th>In the face of dramatically decreased revenue from COVID-19’s impact on the economy, we should encourage state-wide economic growth with stimulus packages and infrastructure spending.</th>
    </tr>
    <tr>
      <th>COVID-19 is a once-in-a-generation sea change. We should shore up the damage using the state’s Rainy Day Fund, and prepare our budget for a 'new normal.'</th>
      <StrongA>
      <ShirRegev says="Please see the above answer. I will add that by helping keep Washington families afloat now, it will save the state more money in the long term by preventing a run on assistance programs."/>
      </StrongA>
      <LeanA>
      <BrettBorden says="Given the large increase in the State budget over the past decade I don't trust Olympia to ever balance the budget. They keep spending more and asking for more even with massive cannabis revenues."/>
      <CarlyCoburn/>
      <DanielleGarbeReser says="COVID-19 has resulted in significant budgetary changes.  We may need to rely partially on our reserves, but that will not be enough alone to adapt to the challenges we face in the future. "/>
      <LarryStanley/>
      <MarkKlicker/>
      </LeanA>
      <LeanB>
      <FrancesChvatal says="Decisions must be considered in light of current revenue reports and the impact of a CARES 2 package"/>
      </LeanB>
      <StrongB>
      <BradKlippert/>
      </StrongB>
      <th>The economic hit from COVID-19 is just a bump in the long road towards a balanced budget. We’ve prepared for this, and should not be making drastic changes to the Washington budget.</th>
    </tr>
    <tr>
      <th>Governor Inslee should call a special legislative session to address foreseen state budget deficits as soon as possible.</th>
      <StrongA>
      <BradKlippert/>
      <DanielleGarbeReser says="I agree with Republicans that we should have a special session to start this work as soon as possible."/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      <FrancesChvatal says="Decisions must be considered in light of current revenue reports and the impact of a CARES 2 package."/>
      <LarryStanley/>
      </LeanA>
      <LeanB>
      <CarlyCoburn/>
      <ShirRegev says="Governor Inslee took steps to ensure the state budget would last until the next session.  This also allows us to see how bad the deficit will be.  It makes sense to only meet once instead of twice right now."/>
      </LeanB>
      <StrongB>
      <BrettBorden/>
      </StrongB>
      <th>The legislative branch works best when we have big, inclusive stakeholder processes followed by public hearings, talking to constituents in groups big and small; this is unwise in the context of the current public health crisis. </th>
    </tr>
    <tr>
      <th>If we must make cuts on education, spending should be reduced on higher education subsidies like tuition assistance.</th>
      <StrongA>
      <LarryStanley/>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <BrettBorden/>
      <CarlyCoburn/>
      <DanielleGarbeReser says="Both ends of the education spectrum are key to our economic development and recovery.  We get such a high return on investment with our early learning programs that I want to protect and support them."/>
      <FrancesChvatal says="If at all possible, I would like to advocate against any cuts to education. Our children and young adults should not bear the burden of this pandemic and budget shortfall."/>
      <MarkKlicker/>
      <ShirRegev says="There is no good answer, but if forced to choose, we need to ensure our Pre-K children have the tools they need survive and thrive. Let's make sure they get to the place where we need to worry about their tuition."/>
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>If we must make cuts on education, spending should be reduced on early learning. </th>
    </tr>
    <tr>
      <th>By incentivizing manufacturing, health care, and agricultural industries in our state, we create a competitive job market, and a vibrant creative economy will occur naturally.</th>
      <StrongA>
      <BradKlippert/>
      <CarlyCoburn/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      <BrettBorden/>
      <DanielleGarbeReser says="We need all of these sectors to be strong for our communities to be thriving, vibrant places to live and work."/>
      <LarryStanley/>
      </LeanA>
      <LeanB>
      <FrancesChvatal/>
      <ShirRegev says="If you want to attract and retain the best minds, there needs to be something to do outside of work. A thriving arts scene does this and also helps draw tourists to our region to spend their money here."/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>Direct funding for the Arts, Cultural Activities, and STEM yield immediate economic benefit to our state, and help our communities retain high-quality professionals.</th>
    </tr>
    <tr>
      <th>Police should be fully funded.</th>
      <StrongA>
      <BradKlippert/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      <DanielleGarbeReser says="Our communities value security. Everyone deserves fair and equitable treatment by law enforcement. We need to prioritize community engagement and hold our police to high but fair standards."/>
      </LeanA>
      <LeanB>
      <FrancesChvatal/>
      </LeanB>
      <StrongB>
      <BrettBorden/>
      <CarlyCoburn/>
      <LarryStanley/>
      <ShirRegev says="We are seeing this play out in real time where departments are asking for more money to deal with mental health calls. Doesn't it make sense then to get more social workers?"/>
      </StrongB>
      <th>Too much is asked of our police; some responsibilities and resources should be shifted to health and social workers and new programs.</th>
    </tr>
    <tr>
      <th>Police officers’ skill set and training are often out of sync with the social interactions that they have with their local communities.</th>
      <StrongA>
      <BrettBorden/>
      <CarlyCoburn/>
      </StrongA>
      <LeanA>
      <FrancesChvatal/>
      <LarryStanley/>
      <ShirRegev/>
      </LeanA>
      <LeanB>
      <DanielleGarbeReser says="We can always improve training building off the standards for accredited police programs."/>
      </LeanB>
      <StrongB>
      <BradKlippert/>
      <MarkKlicker/>
      </StrongB>
      <th>Police officer training programs develop a culture of learning, critical thinking, open-mindedness, tolerance, and healthy curiosity.</th>
    </tr>
    <tr>
      <th>The Washington State COVID policy should be based on the recommendations of public health officials.</th>
      <StrongA>
      <CarlyCoburn/>
      <DanielleGarbeReser says="We need to lead with the data, science, and experts, who tell us to mask up so we can open up."/>
      <FrancesChvatal/>
      <ShirRegev/>
      </StrongA>
      <LeanA>
      <LarryStanley/>
      </LeanA>
      <LeanB>
      <BrettBorden says="Public entities should consult health officials, but private entities should be able to do what is necessary for their livelihoods unencumbered by the State."/>
      <MarkKlicker says="We can both open ours businesses while utilizing guidelines from our health officials"/>
      </LeanB>
      <StrongB>
      <BradKlippert/>
      </StrongB>
      <th>The economic stakes are too high for health officials’ input to dominate the decision making process. It’s time to end restrictions and fully open up our schools and businesses.</th>
    </tr>
    <tr>
      <th>Decisions about public safety are best made by local communities, private businesses, and municipalities, who are most aware of their own local needs.</th>
      <StrongA>
      <BradKlippert/>
      <BrettBorden/>
      <MarkKlicker/>
      <ShirRegev says="Surprise! I do feel local communities have the largest stake in making things succeed. The state should be able to step in though where there is a noticeable downward trend."/>
      </StrongA>
      <LeanA>
      <DanielleGarbeReser says="The state should set standards and local communities should have flexibility to respond to local needs."/>
      <LarryStanley/>
      </LeanA>
      <LeanB>
      <CarlyCoburn/>
      <FrancesChvatal says="I believe that decisions about public safety should be made by the Health authorities at the state and county level.  Both should strive to work together for the common good."/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>Decisions about public safety are best made at the state level, where resources of the entire state can be used to benefit everyone and coordinate intra-community needs with a bird’s eye view, taking the heat off of local politicians, who have other challenges to deal with in leading communities through these challenges.</th>
    </tr>
    <tr>
      <th>Washington State’s current ‘Top 2 in the Primary’ voting system satisfies the needs of the community. Unnecessarily changing or complicating the existing voting system would only cause confusion and voter exhaustion.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      <BrettBorden says="I support reforms like RCV in order to better represent the will of voters, and am the only candidate running in the 9th district to be recognized by FairVote Washington for this advocacy."/>
      <CarlyCoburn/>
      <DanielleGarbeReser says="The Governor’s primary race was an example of the disenfranchisement that happens to voters whose candidate is not picked.  I support exploring other options like ranked choice voting."/>
      <LarryStanley/>
      <ShirRegev says="Top 2 Primaries are the most damaging thing to have happened to our elections in recent years.  On the premise of saving a drop in the state budget bucket we have been robbed of real choices during the election cycle."/>
      </StrongB>
      <th>Washington State’s ‘Top 2 in the Primary’ voting system was a step in the right direction in 2004, but we need to take the next leap forward on election reform, where candidates win by majority, not by mere plurality (e.g. with Ranked Choice, or Instant Runoff voting systems).</th>
    </tr>
    <tr>
      <th>More state funding for education is needed to cope with COVID-19.</th>
      <StrongA>
      <CarlyCoburn/>
      <ShirRegev says="Re-directing school levy funds significantly impacts those who have the most to lose. Rainy day funds exist for a reason. Supplementing schools to protect our children and their teachers is a worthy use of those dollars."/>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <DanielleGarbeReser says="Many of our districts have increased costs from providing online learning that need to be addressed now. I want our districts to have more flexibility with their levies in the future."/>
      <FrancesChvatal says="I do not believe this is a either/or depending on the community and their needs"/>
      <MarkKlicker/>
      </LeanA>
      <LeanB>
      <BrettBorden/>
      <LarryStanley/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>School districts should be allowed to supplement more of their funding with levies.</th>
    </tr>
    <tr>
      <th>Cutting educational service provider (ESP) jobs is shortsighted and harmful to students.</th>
      <StrongA>
      <CarlyCoburn/>
      <DanielleGarbeReser says="We need to maintain supports in our schools, particularly for students with special education needs."/>
      <FrancesChvatal says="I would defer to precedent and the constitution to determine any decrease in educational spending.  I also, very much support emergency and public health services."/>
      <ShirRegev says="Using COVID-19 as an excuse to curtail union agreements with support staff is cynical. These employees provide invaluable services to our schools.  Their union wages are what is keeping their own families afloat."/>
      </StrongA>
      <LeanA>
      <LarryStanley/>
      </LeanA>
      <LeanB>
      <BradKlippert/>
      <BrettBorden/>
      <MarkKlicker/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>While COVID-19 is impacting communities now, it is important to remain prepared for future crises and maintain funding for emergency reserves.</th>
    </tr>
    <tr>
      <th> It is the responsibility of local school districts and the voters therein to decide its annual budget.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <BrettBorden says="I am generally supportive of more local control over education and school choice, though recognize that funding this way can open the door to disparate results based on geography and wealth."/>
      <DanielleGarbeReser says="Post the McCleary decision we are at better parity.  Our focus going forward needs to be on the flexibility our communities want to pass the levies that make sense for each district."/>
      <MarkKlicker/>
      </LeanA>
      <LeanB>
      <CarlyCoburn/>
      <FrancesChvatal/>
      <LarryStanley/>
      </LeanB>
      <StrongB>
      <ShirRegev says="As evidenced by McCleary, the Legislature has neglected funding schools at a level that provides our students with the level of education they need to be the next generation of Washington success stories."/>
      </StrongB>
      <th>The state has perpetually underfunded schools. State-level tax revenue should be used to provide equity among its districts.</th>
    </tr>
    <tr>
      <th>Climate change is not an issue that states can or should address.</th>
      <StrongA>
      <BradKlippert/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      </LeanA>
      <LeanB>
      <BrettBorden/>
      </LeanB>
      <StrongB>
      <CarlyCoburn/>
      <DanielleGarbeReser says="Washington State has always been a leader.  We should lead in creating and attracting the clean energy jobs and businesses of the future, like Moses Lake is doing with its new solar business."/>
      <FrancesChvatal/>
      <LarryStanley/>
      <ShirRegev says="We need to accept climate change is real.  Instead of pretending it's not happening let's take the opportunity to become leaders in the manufacture of clean solutions."/>
      </StrongB>
      <th>I support climate policies that incentivize Washington to do its part to prevent climate change.</th>
    </tr>
    <tr>
      <th>Prioritizing environmental sustainability and resiliency are essential to responsible legislating.</th>
      <StrongA>
      <DanielleGarbeReser says="I believe we use our taxpayer dollars more wisely for the long run when we keep sustainability and resiliency at the forefront of our decision making."/>
      <LarryStanley/>
      <ShirRegev/>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <BrettBorden/>
      <CarlyCoburn/>
      <FrancesChvatal/>
      </LeanA>
      <LeanB>
      <MarkKlicker says="Prioritizing for forest management for wildfire protection would be an important necessity if there is a budget for it. Funds for things such as the new green deal or studies for saving the Orca's is not a necessity."/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>Prioritizing environmental sustainability and resiliency is something we only need to look at if there is budget for it.</th>
    </tr>
    <tr>
      <th>We have an abundance of open, natural spaces and we need to focus on economic development over conservation or sustainability.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <MarkKlicker/>
      </LeanA>
      <LeanB>
      <BrettBorden says="I support opening up public lands to an even greater extent and devolving control to the people for common usage. After all, it is our public land."/>
      <DanielleGarbeReser says="Our region can’t grow without maintaining sustainable, clean water sources for agricultural, manufacturing, residential, and recreational use."/>
      <LarryStanley/>
      </LeanB>
      <StrongB>
      <CarlyCoburn/>
      <FrancesChvatal/>
      <ShirRegev/>
      </StrongB>
      <th>The natural environment is crucial to quality of life and economic prosperity. We should prioritize protecting it.</th>
    </tr>
    <tr>
      <th>I will make the best decision I can based on my experience, judgment, and beliefs.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <BrettBorden says="While I am running on a platform dedicated to individual liberties and will not stray from this commitment, it is important to be able to listen and discuss issues with anybody and be open to what they are saying."/>
      <MarkKlicker says="It's important to seek opinions and perspectives from others and I will do just that.  However my decisions will be made based upon the needs and concerns of the people in the district."/>
      </LeanA>
      <LeanB>
      <CarlyCoburn/>
      <DanielleGarbeReser says="I will bring my experience as an Eastern Washingtonian to the legislature and will keep an open mind to listen to all sides and use data, science, and experts to finalize my views."/>
      <FrancesChvatal/>
      </LeanB>
      <StrongB>
      <LarryStanley/>
      <ShirRegev says="You can't say you have made an informed decision if you haven't sought out multiple perspectives.  Part of the crisis of democracy we find ourselves in is the result of myopic leadership. "/>
      </StrongB>
      <th>I will seek opinions and perspectives different from my own when formulating a decision.</th>
    </tr>
    <tr>
      <th>Open public engagement can be disorganized, noisy, and vulnerable to being hijacked by vocal minority opinions. Sometimes hard decisions must be made behind closed doors so that leaders can make decisions without fear of retribution.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      </LeanA>
      <LeanB>
      <BradKlippert/>
      </LeanB>
      <StrongB>
      <BrettBorden/>
      <CarlyCoburn/>
      <DanielleGarbeReser says="Transparency is a key value of mine and needs to be prioritized as we make decisions using taxpayer resources and affecting everyone’s lives and livelihoods."/>
      <FrancesChvatal/>
      <LarryStanley/>
      <MarkKlicker/>
      <ShirRegev/>
      </StrongB>
      <th>State legislators are hired by the people and for the people, and should be transparent about as many decisions as possible.</th>
    </tr>
    <tr>
      <th>State legislature dedicates a large amount of resources to ensure healthy communication, and works hard at educating the public on how to use what exists.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <BrettBorden/>
      <FrancesChvatal/>
      </LeanA>
      <LeanB>
      <DanielleGarbeReser says="Communication must improve. Even with funding limitations in this budget cycle, we can use free methods to connect with more residents."/>
      <MarkKlicker/>
      </LeanB>
      <StrongB>
      <CarlyCoburn/>
      <LarryStanley/>
      <ShirRegev/>
      </StrongB>
      <th>Communication methods used by state legislators are out-dated and underfunded. Funding for upgrades to, and person-power to support, the existing systems is critical.</th>
    </tr>
    <tr>
      <th>The state transportation budget should focus on road maintenance, repairs, and expansion to reduce congestion.</th>
      <StrongA>
      <BradKlippert/>
      <MarkKlicker/>
      </StrongA>
      <LeanA>
      <BrettBorden says="Transportation is one of these areas where we throw increasing gobs of money at the problem with little to show for it. While (A) is important, we have not been getting our money's worth and that must be examined."/>
      <DanielleGarbeReser says="In the 16th LD, we have major repair and infrastructure needs that need to take priority in a tough budget environment."/>
      <CarlyCoburn/>
      </LeanA>
      <LeanB>
      <FrancesChvatal/>
      <LarryStanley says="There should be a some of each. All infrastructure should be updated for safety and efficiency."/>
      <ShirRegev says="It’s hard not to drive when a 10 minute drive takes over an hour by bus. I'll work to find which revenue streams are available to help increase the frequency of buses so folks are more willing to leave the car at home."/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>The state transportation budget should focus on supporting carbon-free charging/fueling, and on increasing the use of carpooling, mass transit, and bicycles.</th>
    </tr>
    <tr>
      <th>The Joint Transportation Committee released the following Feasibility Study in June 2020 (bit.ly/3bNbVvI). I stand with 70% of those surveyed in support of the proposed East-West interstate passenger rail system that increases inter-connectivity between Southeastern Washington and the rest of the State, while reducing carbon emissions.</th>
      <StrongA>
      <CarlyCoburn/>
      </StrongA>
      <LeanA>
      <DanielleGarbeReser says="I am really interested in learning more about high speed rail options that include Eastern Washington."/>
      <FrancesChvatal says="This is a proposal that I would need to thoroughly review and study. We must invest and create systems for many years into the future and view through the prism health, both humanity and the earth"/>
      <LarryStanley/>
      <ShirRegev/>
      </LeanA>
      <LeanB>
      <BradKlippert/>
      <BrettBorden/>
      <MarkKlicker/>
      </LeanB>
      <StrongB>
      </StrongB>
      <th>The Joint Transportation Committee has released the following Feasibility Study in June 2020 (bit.ly/3bNbVvI). The proposed East-West interstate passenger rail system comes at too high an upfront cost to Washingtonians, for what low ridership is eventually expected. The state has higher priorities for its transportation budget, and I support focused funding on the interstate road system in which citizens have already heavily invested.</th>
    </tr>
    <tr>
      <th>The city has a role to play in cost of living and affordable housing.</th>
      <StrongA>
      <CarlyCoburn/>
      <FrancesChvatal/>
      <LarryStanley/>
      <ShirRegev says="A key factor in gaining stability is being able to maintain housing. In our community the ability to find an affordable place to live is out of reach for too many residents and it has not been addressed."/>
      </StrongA>
      <LeanA>
      <DanielleGarbeReser says="We need the state to partner in rural areas to make construction more affordable and accessible. The state can also help support job programs in the trades that will make labor more available for construction."/>
      </LeanA>
      <LeanB>
      <BradKlippert/>
      </LeanB>
      <StrongB>
      <BrettBorden says="The key being that the market needs to actually be open. Heavy regulations like zoning block the construction of new housing and enables NIMBY elitism that leaves us with artificially restricted, expensive housing."/>
      <MarkKlicker/>
      </StrongB>
      <th>Cost of living and housing affordability should be left solely to the market.</th>
    </tr>
    <tr>
      <th>We should control and guide suburban sprawl in our state even if doing so affects short-term economic growth.</th>
      <StrongA>
      <LarryStanley/>
      </StrongA>
      <LeanA>
      <CarlyCoburn/>
      <FrancesChvatal/>
      <ShirRegev says="What we need to do is make it attractive to developers to pursue high density, residential projects to revitalize our CBDs.  Having a vibrant, walk-able city center attracts young professionals and tourists."/>
      </LeanA>
      <LeanB>
      <DanielleGarbeReser says="The state can provide guidance, but our local areas need to be the driving force behind what works for each county in partnership with our market players."/>
      </LeanB>
      <StrongB>
      <BradKlippert/>
      <BrettBorden/>
      <MarkKlicker/>
      </StrongB>
      <th>We shouldn’t restrain free market development; it's critical to our local economies.</th>
    </tr>
    <tr>
      <th>We have ceded far too much in allowing our society to be shaped by LGBTQ+ ‘identity politics.’</th>
      <StrongA>
      <BradKlippert/>
      <DanielleGarbeReser/>
      <MarkKlicker says="I believe we are all equal and and no person of color, race or sexual identification should be discriminated against or given special privileges."/>
      </StrongA>
      <LeanA>
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      <BrettBorden/>
      <CarlyCoburn/>
      <FrancesChvatal/>
      <LarryStanley/>
      <ShirRegev says="This district elects a man who make's it his life's work to legislate my community away. How do you think it makes any other member of the LGBTQ community feel when he advocates for discrimination from the House floor?"/>
      </StrongB>
      <th>We have taken positive steps forward in making our state more inclusive for LGBTQ+ and gender-nonconforming people, but there is still more progress that can be made at the state level to create a more equitable, just, and compassionate society for everyone.</th>
    </tr>
    <tr>
      <th>Racism is a real and unfortunate thing, but it is a personal matter. We have made good progress as a society in overcoming racism and we should not try to create legislation which may overreach in order to appease minority groups.</th>
      <StrongA>
      </StrongA>
      <LeanA>
      <BradKlippert/>
      <MarkKlicker/>
      </LeanA>
      <LeanB>
      </LeanB>
      <StrongB>
      <BrettBorden says="Meaningful justice reform measures are my #1 priority."/>
      <CarlyCoburn/>
      <DanielleGarbeReser/>
      <FrancesChvatal/>
      <LarryStanley/>
      <ShirRegev says="We saw it nationally with a President who told a known white supremacist hate group to 'Stand by.' and locally when all but two elected officials refused to denounce Defend the Tri."/>
      </StrongB>
      <th>Systemic racism is real and there are many things we must do at the state level to respond to the urgent challenge of creating a more just society.</th>
    </tr>
    </tbody>
    </table>
  )

}

export default CompareLegislators;