import React from 'react';
import { StrongA, LeanA, LeanB, StrongB, NoResponse } from '../statements';
import {
  AnaRuizPeralta,
  BradPeck,
  JeromeDelvin,
  JustinRaffa,
  KimLehrman,
  RockyMullen,
} from '../candidates';

const CompareLegislators = () => {
  return (
    <table>
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
            I will make the best decision I can based on my experience,
            judgment, and beliefs.
          </th>
          <StrongA>
            <RockyMullen spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradPeck
              spec="true"
              says="Responsible decision making balances your own knowledge and experience with the advice and counsel of others. Every decision varies. Timely decisions do not always permit the amount of desired coordination."
            />
          </LeanA>
          <LeanB>
            <AnaRuizPeralta />
            <JustinRaffa says="While an elected official's personal experience and judgement do play into their decision making process, I will value the perspectives of residents and stakeholders on issues, especially ones outside of my expertise." />
          </LeanB>
          <StrongB>
            <KimLehrman />
          </StrongB>
          <th>
            I will seek opinions and perspectives different from my own when
            formulating a decision.
          </th>
        </tr>
        <tr>
          <th>
            Systemic racism is a problem in Benton and Franklin counties, and we
            need to make changes in our law enforcement, justice system, and
            public health delivery to address it.
          </th>
          <StrongA>
            <AnaRuizPeralta />
            <KimLehrman />
          </StrongA>
          <LeanA>
            <JustinRaffa says="Benton County has the same challenges of systemic racism that face our entire country. Limitations on a Commissioner's authority over county law enforcement and the justice system requires cooperation between agencies." />
            <BradPeck
              spec="true"
              says="I have no tolerance for racism, system or otherwise. As a public official I feel an added responsibility to stand against racism anywhere in our community."
            />
          </LeanA>
          <LeanB>
            <RockyMullen spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <JeromeDelvin
              spec="true"
              says="I don't believe in the term ‘systemic racism.’ Is there still racism yes, but our country has involved in a more just society and law enforcement should not automatically be seen as racist."
            />
          </StrongB>
          <th>
            Racism is a personal matter. We should not overburden our law
            enforcement, justice, or public health systems with trying to ‘fix’
            it.
          </th>
          <NoResponse />
        </tr>
        <tr>
          <th>
            Our area is a diverse, inclusive community with equitable
            representation in setting policies and deciding major issues.
          </th>
          <StrongA />
          <LeanA>
            <JeromeDelvin
              spec="true"
              says="I always strive for a better community in diversity and my record show's that."
            />
            <RockyMullen spec="true" dnr="true" />
          </LeanA>
          <LeanB />
          <StrongB>
            <AnaRuizPeralta />
            <JustinRaffa says="By actively engaging the community and seeking to develop collaborative policies with representatives from our diverse communities of color, Benton County can help champion issues of equity in our local government." />
            <KimLehrman />
          </StrongB>
          <th>
            We must take greater steps to ensure that all voices have a seat the
            table when deciding major issues, especially underserved and
            underrepresented people.
          </th>
          <NoResponse>
            <BradPeck says="We need to hear from all affected audiences and need officials who know how to listen. Character, skill, and effort are the traits we need in our public servants." />
          </NoResponse>
        </tr>
        <tr>
          <th>
            Mental health and substance abuse are big issues for a growing
            number of residents, with serious ripple effects. The County has an
            important policy role to play in this area.
          </th>
          <StrongA>
            <AnaRuizPeralta />
            <JustinRaffa says="The county needs to provide a comprehensive series of treatments and services for behavioral health, including the creation of a bi-county rehabilitation center for mental health and substance abuse issues." />
            <KimLehrman />
          </StrongA>
          <LeanA>
            <JeromeDelvin says="I will continue to work on mental health and addiction issues as a commissioner." />
            <BradPeck
              spec="true"
              says="It is actually a Washington state responsibility often delegated to counties without the required funding. I support increasing our budget for expanded mental health services, especially within the local justice system."
            />
            <RockyMullen spec="true" dnr="true" />
          </LeanA>
          <LeanB />
          <StrongB />
          <th>
            The effects of mental health and substance abuse are real, but it’s
            not the County’s role to expend exorbitant amounts of our limited
            budget trying to address what are fundamentally individual problems.
          </th>
        </tr>
        <tr>
          <th>
            Homelessness is a growing problem. The County should take a lead
            role in coordinating and marshaling resources to address it.
          </th>
          <StrongA>
            <KimLehrman />
          </StrongA>
          <LeanA>
            <AnaRuizPeralta />
            <JustinRaffa says="The county has an opportunity to leverage its position and help inspire a shared vision with our local jurisdictions by taking the lead to create a regional strategy in combating homelessness." />
            <BradPeck
              spec="true"
              says="The county has a major role to play, along with many other local governments and agencies."
            />
          </LeanA>
          <LeanB>
            <JeromeDelvin says="Our county has a strong human service department and is always partnering with advocates and resource providers." />
            <RockyMullen spec="true" dnr="true" />
          </LeanB>
          <StrongB />
          <th>
            Homelessness is a growing problem, but the County is a supporting
            player in addressing it and should follow the lead of service
            providers and law enforcement.
          </th>
        </tr>
        <tr>
          <th>
            The decades-old Benton-Franklin commitment to shared services and
            systems continues to be mutually beneficial. We should work to
            preserve it.
          </th>
          <StrongA>
            <AnaRuizPeralta />
            <JustinRaffa says="We need to rebuild our relationship with Franklin County and preserve these successful bi-county services. Sharing the courts and health district helps lower their fiscal impact and saves tax payer dollars." />
            <KimLehrman />
            <BradPeck says="The counties can partner under several different structures. Partnership is not just about fiscal efficiency. Service delivery is often the best justification, as is the case with the bi-county court system." />
          </StrongA>
          <LeanA />
          <LeanB>
            <RockyMullen spec="true" dnr="true" />
            <JeromeDelvin
              spec="true"
              says="I agree with parts of both statements. We should always be looking at institutions for improvement of service and use of tax monies. May mean joint efforts or each county to provide what they believe for their residents."
            />
          </LeanB>
          <StrongB />
          <th>
            The Benton-Franklin commitment to shared services was useful for
            many years, but has outlived its effectiveness and the counties
            should pursue their own individual services.
          </th>
        </tr>
        <tr>
          <th>
            The role the Benton-Franklin Health District has played in the
            COVID-19 response highlights the critical importance of sufficiently
            funding the Health District to lead the way during public health
            emergencies.
          </th>
          <StrongA>
            <AnaRuizPeralta />
            <JustinRaffa says="I will work to ensure that BFHD is adequately funded well into the future and help improve its community education around the importance of public health. Today, the agency remains understaffed and under-resourced." />
            <KimLehrman />
          </StrongA>
          <LeanA />
          <LeanB />
          <StrongB>
            <RockyMullen spec="true" dnr="true" />
          </StrongB>
          <th>
            The role of the Benton-Franklin Health District in the COVID-19
            response demonstrates that their funding reductions over the past
            several years were justified.
          </th>
          <NoResponse>
            <BradPeck says="The counties have provided more funding than the health district has used...and more funds are available. I have supported statewide efforts to ensure the state legislature provides adequate funding for public health." />
            <JeromeDelvin says="Benton County has not reduced funding from the county but the state has cut funding to health districts. I am working within the current and future county budget for more funding for our health district." />
          </NoResponse>
        </tr>
        <tr>
          <th>
            COVID-19 has exposed weaknesses in the County’s readiness for future
            pandemics, which should be planned for and accounted for in the
            budgeting process.
          </th>
          <StrongA>
            <AnaRuizPeralta />
            <JustinRaffa says="While I applaud the efforts of the county to combat COVID-19 four months after its declaration as a global pandemic, we could have advanced to Phase 2 by now had it not been for Commissioner inaction and grandstanding." />
            <KimLehrman />
          </StrongA>
          <LeanA />
          <LeanB>
            <BradPeck
              spec="true"
              says="It’s been more than a century since we had a pandemic of this proportion. We must learn from this experience without compromising our readiness for other, more likely emergencies."
            />
            <JeromeDelvin
              spec="true"
              says="The county was prepared for the pandemic as any other government agency in our state and country. Weakness were exposed throughout our country."
            />
          </LeanB>
          <StrongB>
            <RockyMullen spec="true" dnr="true" />
          </StrongB>
          <th>
            COVID-19 turned out to be much less severe than the early
            fearmongers would have us believe, and our scarce County resources
            shouldn’t be wasted planning for something that may never happen.
          </th>
        </tr>
        <tr>
          <th>
            In order to prevent suburban sprawl, the County should prioritize
            infill growth within the Cities before expanding growth boundaries.
          </th>
          <StrongA />
          <LeanA>
            <JustinRaffa says="I stand for a balanced approach to decision making but am opposed to the concept of sprawl which has been growing in our communities. We need to focus on maximizing value in the existing Urban Growth Areas." />
          </LeanA>
          <LeanB>
            <AnaRuizPeralta />
          </LeanB>
          <StrongB>
            <KimLehrman />
            <RockyMullen spec="true" dnr="true" />
          </StrongB>
          <th>
            Because development is essential for our economy and affordable
            housing, the County should prioritize working with developers to
            expand property availability regardless of location.
          </th>
          <NoResponse>
            <JeromeDelvin says="The county works with the cities on urban growth boundaries along with other interested parties. There is a balance to be sure on growth. I do work with home builders and developers." />
            <BradPeck says="In-fill of available lands is highly desirable. Careful expansion of Urban Growth Areas is unavoidable. Balancing the two obligations is responsible and realistic. " />
          </NoResponse>
        </tr>
        <tr>
          <th>
            We have an abundance of open, natural spaces and we need to focus on
            economic development over conservation.
          </th>
          <StrongA />
          <LeanA>
            <BradPeck
              spec="true"
              says="Development and conservation are not mutually exclusive. I do not support unregulated development, but recognize the economic value of responsible development. With careful planning we can have the benefits of both."
            />
            <RockyMullen spec="true" dnr="true" />
          </LeanA>
          <LeanB>
            <AnaRuizPeralta />
            <JustinRaffa says="Open spaces for outdoor recreation and parks positively impact our quality of life and help attract new residents and business investments. We need a mix of residential, commercial, and open spaces for continued growth." />
          </LeanB>
          <StrongB>
            <KimLehrman />
          </StrongB>
          <th>
            The natural environment is crucial to quality of life and economic
            prosperity.
          </th>
          <NoResponse>
            <JeromeDelvin says="Again, a balance is needed for both. The bottom line is the quality of life for our residents. I have worked with groups to preserve natural areas such as ridge-lines." />
          </NoResponse>
        </tr>
        <tr>
          <th>
            Climate change is not an issue that counties can or should address.
          </th>
          <StrongA>
            <JeromeDelvin
              spec="true"
              says="The climate has been and will always change and we must work and adapt to the changes."
            />
            <RockyMullen spec="true" dnr="true" />
          </StrongA>
          <LeanA>
            <BradPeck
              spec="true"
              says="I agree the climate is changing. I don’t believe local efforts are providing meaning results. National efforts to influence the gross polluters of the world are a better investment."
            />
          </LeanA>
          <LeanB />
          <StrongB>
            <AnaRuizPeralta />
            <JustinRaffa says="Impacts of climate change threaten communities across the country. Government must play a part to combat this issue and educate residents about its severity. Management of water resources is key for the county's growth." />
            <KimLehrman />
          </StrongB>
          <th>
            I support climate policies that incentivize our local community
            doing our part to prevent climate change.
          </th>
        </tr>
        <tr>
          <th>
            The county is doing a good job of being transparent and providing
            the public ample opportunities for input.
          </th>
          <StrongA />
          <LeanA>
            <JeromeDelvin says="I am always looking for better ways for community engagement but I am very transparent." />
          </LeanA>
          <LeanB>
            <RockyMullen spec="true" dnr="true" />
          </LeanB>
          <StrongB>
            <AnaRuizPeralta />
            <JustinRaffa says="Our county government has flown under the radar too long. Many citizens don’t know the services it stewards or who their commissioners are. I will foster an environment that invites engagement in county government." />
            <KimLehrman />
          </StrongB>
          <th>
            The county should do a much better job of being transparent and
            engaging the community in the decision making process.
          </th>
          <NoResponse>
            <BradPeck says="Every county action is done in open public recorded meetings with ample opportunity to comment. I support evening meetings rather than daytime business hour meetings as a way to increase public participation." />
          </NoResponse>
        </tr>
      </tbody>
    </table>
  );
};

export default CompareLegislators;
