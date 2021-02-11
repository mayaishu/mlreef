import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { toastr } from 'react-redux-toastr';
import { MLoadingSpinnerContainer } from 'components/ui/MLoadingSpinner';
import {
  shape,
  string,
  func,
} from 'prop-types';
import hooks from 'customHooks/useSelectedProject';
import './ExperimentDetail.scss';
import MSimpleTabs from 'components/ui/MSimpleTabs';
import { setPreconfiguredOPerations } from 'store/actions/userActions';
import Navbar from '../navbar/navbar';
import ProjectContainer from '../projectContainer';
import DetailsSummary from './MenuOptions/DetailSummary';
import Files from './MenuOptions/ExperimentArtifacts';
import JobLog from './MenuOptions/jobLog';
import actions from './actions';

export const UnconnectedExperimentDetails = (props) => {
  const [experiment, setExperiment] = useState({});
  const [jobs, setJobs] = useState([]);
  const {
    match: { params: { namespace, slug, experimentId } },
    setPreconfiguredOPerations,
    history,
  } = props;

  const [selectedProject, isFetching] = hooks.useSelectedProject(namespace, slug);

  const {
    id,
    gid,
    name,
    gitlab,
  } = selectedProject;

  const userKind = gitlab?.namespace?.kind;
  const userParameters = experiment?.processing?.parameters;
  const { pipeline_job_info: pipelineInfo } = experiment;
  const experimentName = experiment.name;
  const uniqueName = experimentName && experimentName.split('/')[1];
  const experimentJob = jobs.filter((job) => job.ref === experiment.name)[0];
  useEffect(() => {
    if (id && gid) {
      actions.getExperimentDetails(id, experimentId)
        .then((res) => setExperiment(res))
        .catch(() => toastr.error('Error', 'Could not fetch the experiment'));

      actions.getJobsPerProject(gid)
        .then((js) => setJobs(js))
        .catch((err) => toastr.error('Error', err.message));
    }
  }, [gid, id, experimentId]);

  const breadcrumbs = useMemo(
    () => [
      {
        name: namespace,
        href: userKind === 'group' ? `/groups/${namespace}` : `/${namespace}`,
      },
      {
        name,
        href: `/${namespace}/${slug}`,
      },
      {
        name: 'Experiments',
        href: `/${namespace}/${slug}/-/experiments`,
      },
      {
        name: uniqueName,
      },
    ],
    [namespace, slug, name, uniqueName, userKind],
  );

  if (isFetching) {
    return (
      <MLoadingSpinnerContainer active />
    );
  }

  return (
    <>
      <Navbar />
      <ProjectContainer
        project={selectedProject}
        activeFeature="experiments"
        breadcrumbs={breadcrumbs}
      />
      <div className="main-content mt-4">
        <MSimpleTabs
          vertical
          pills
          sections={[
            {
              label: 'Details',
              content: experimentJob && (
                <DetailsSummary
                  projectNamespace={namespace}
                  projectSlug={slug}
                  projectId={gid}
                  inputFiles={experiment.input_files}
                  dataOperatorsExecuted={experiment.processing}
                  experimentName={uniqueName}
                  parameters={userParameters}
                  pipelineInfo={pipelineInfo}
                  setPreconfiguredOPerations={setPreconfiguredOPerations}
                  history={history}
                />
              ),
              defaultActive: true,
            },
            {
              label: 'Training',
              content: experimentJob && (
                <JobLog
                  projectId={parseInt(gid, 10)}
                  currentState={experimentJob && experimentJob.status}
                  job={experimentJob}
                />
              ),
            },
            {
              label: 'Files',
              content: gid && experimentJob && (
                <Files projectId={gid} job={experimentJob} />
              ),
            },
          ]}
        />
      </div>
    </>
  );
};

UnconnectedExperimentDetails.propTypes = {
  match: shape({
    params: shape({
      experimentId: string.isRequired,
    }).isRequired,
  }).isRequired,
  setPreconfiguredOPerations: func.isRequired,
  history: shape({}).isRequired,
};

function mapActionsToProps(dispatch) {
  return {
    setPreconfiguredOPerations: bindActionCreators(setPreconfiguredOPerations, dispatch),
  };
}

export default connect(() => ({}), mapActionsToProps)(UnconnectedExperimentDetails);