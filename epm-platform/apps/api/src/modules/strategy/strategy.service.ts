import { Injectable, NotFoundException } from '@nestjs/common';
import {
  krProgress, objectiveScore, objectiveStatus, perspectiveScore, strategyScore, aggregateObjectives,
  type ObjectiveStatus,
} from '@mizan/domain';
import { StrategyRepository } from './strategy.repository';
import { AuthUser } from '../../common/auth/auth-user';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateKeyResultDto } from './dto/update-key-result.dto';

export interface StrategyMapObjective {
  id: string;
  title: string;
  progress: number | null;
  status: ObjectiveStatus;
}
export interface StrategyMapPerspective {
  id: string;
  name: string;
  color: string | null;
  score: number | null;
  objectives: StrategyMapObjective[];
}
export interface StrategyMap {
  perspectives: StrategyMapPerspective[];
  overall: number | null;
}

export interface KeyResultView {
  id: string;
  title: string;
  current: number;
  target: number;
  progress: number;
}
export interface OkrView {
  id: string;
  objective: string;
  owner: string | null;
  score: number | null;
  status: ObjectiveStatus;
  keyResults: KeyResultView[];
}

/** Strategy application service — Balanced Scorecard + OKRs, scored via @mizan/domain. */
@Injectable()
export class StrategyService {
  constructor(private readonly repo: StrategyRepository) {}

  /** Balanced Scorecard: perspectives → objectives, rolled up to an overall score. */
  async map(user: AuthUser): Promise<StrategyMap> {
    const rows = await this.repo.perspectivesWithObjectives(user.tenantId);
    const perspectives: StrategyMapPerspective[] = rows.map((p) => {
      const objectives = p.objectives.map((o) => ({
        id: o.id,
        title: o.title,
        progress: o.progress,
        status: objectiveStatus(o.progress),
      }));
      return {
        id: p.id,
        name: p.name,
        color: p.color,
        score: perspectiveScore(p.objectives.map((o) => ({ progress: o.progress, weight: o.weight }))),
        objectives,
      };
    });
    const overall = strategyScore(perspectives.map((p) => ({ score: p.score })));
    return { perspectives, overall };
  }

  /** OKRs with computed key-result progress, objective score and status. */
  async okrs(user: AuthUser): Promise<{ okrs: OkrView[]; summary: ReturnType<typeof aggregateObjectives> }> {
    const rows = await this.repo.objectives(user.tenantId, { type: 'OKR' });
    const okrs: OkrView[] = rows.map((o) => {
      const keyResults = o.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        current: kr.currentValue,
        target: kr.targetValue,
        progress: krProgress(kr.startValue, kr.currentValue, kr.targetValue),
      }));
      const score = objectiveScore(o.keyResults);
      return {
        id: o.id,
        objective: o.title,
        owner: null,
        score,
        status: objectiveStatus(score),
        keyResults,
      };
    });
    const summary = aggregateObjectives(okrs.map((o) => ({ progress: o.score })));
    return { okrs, summary };
  }

  async createObjective(user: AuthUser, dto: CreateObjectiveDto) {
    return this.repo.createObjective(user.tenantId, {
      title: dto.title,
      description: dto.description,
      type: dto.type,
      weight: dto.weight ?? 1,
      status: 'NOT_STARTED',
      ...(dto.perspectiveId ? { perspective: { connect: { id: dto.perspectiveId } } } : {}),
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
      ...(dto.ownerId ? { ownerId: dto.ownerId } : {}),
    });
  }

  /** Check in on a key result; recompute its progress and the parent objective's. */
  async updateKeyResult(user: AuthUser, objectiveId: string, krId: string, dto: UpdateKeyResultDto) {
    const kr = await this.repo.findKeyResult(user.tenantId, objectiveId, krId);
    if (!kr) throw new NotFoundException(`Key result ${krId} not found`);
    const target = dto.targetValue ?? kr.targetValue;
    const progress = krProgress(kr.startValue, dto.currentValue, target);
    await this.repo.updateKeyResult(krId, { currentValue: dto.currentValue, targetValue: target, progress });

    // Recompute and persist the parent objective's rolled-up score + status.
    const refreshed = await this.repo.objectives(user.tenantId, { id: objectiveId });
    const obj = refreshed[0];
    const score = objectiveScore(obj.keyResults);
    await this.repo.updateObjective(user.tenantId, objectiveId, {
      progress: score ?? 0,
      status: objectiveStatus(score),
    });
    return { id: krId, progress, objectiveScore: score, objectiveStatus: objectiveStatus(score) };
  }
}
