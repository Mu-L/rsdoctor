import type {
  Compiler,
  Compilation,
  Stats,
  StatsError,
  RuleSetRule,
} from 'webpack';
import type {
  Compiler as RspackCompiler,
  Compilation as RspackCompilation,
  Stats as RspackStats,
  RuleSetRule as RspackRuleSetRule,
  MultiCompiler,
} from '@rspack/core';

type RspackCompilerWrapper = RspackCompiler &
  Pick<
    MultiCompiler,
    keyof Omit<MultiCompiler, 'hooks' | 'options' | 'isChild'>
  >;

// type RspackCompilationWrapper = any extends RspackCompilation
//   ? never
//   : RspackCompilation;

type RspackStatsWrapper = any extends RspackStats ? never : RspackStats;

type RspackRuleSetRuleWrapper = any extends RspackRuleSetRule
  ? never
  : RspackRuleSetRule;

export type BaseCompilerType<T extends 'rspack' | 'webpack' = 'webpack'> =
  T extends 'rspack' ? RspackCompilerWrapper : Compiler;
export type BaseCompiler = BaseCompilerType | BaseCompilerType<'rspack'>;

export type BaseCompilationType<T extends 'rspack' | 'webpack' = 'webpack'> =
  T extends 'rspack' ? Compilation : RspackCompilation;
export type BaseCompilation =
  | BaseCompilationType
  | BaseCompilationType<'rspack'>;

export type BaseStats = Stats | RspackStatsWrapper;

export interface JsStatsError {
  message: string;
  formatted?: string;
  title?: string;
}

export interface JsStatsWarning extends JsRspackError {
  message: string;
  formatted?: string;
}

export interface JsRspackError {
  name?: string;
  message: string;
  moduleIdentifier?: string;
  loc?: string;
  file?: string;
  stack?: string;
  hideStack?: boolean;
}

export type BuildError = JsStatsError | StatsError;
export type BuildWarning = JsStatsWarning | StatsError;

export type BuildRuleSetRules = (
  | false
  | ''
  | 0
  | RuleSetRule
  | '...'
  | null
  | undefined
)[];
export type BuildRuleSetRule = RuleSetRule | RspackRuleSetRuleWrapper;
