import { task, series, Task, parallel } from 'just-scripts'

import exec from './build/exec'

const getProjectsInBuildOrder = (): string[] => [
  'validator',
  'rest-api-server',
  'open-api-endpoint',
]

const forAll = (item: (name: string) => Promise<void>): Task[] =>
  getProjectsInBuildOrder().map(it => item.bind(null, it))

const compile = async (name: string, ...extras: string[]) => {
  exec('yarn', 'tsc', '--build', `packages/${name}/tsconfig.build.json`, ...extras)
}

const validateTs = async (name: string) => {
  exec('yarn', 'tsc', '--noEmit', '--project', `packages/${name}/tsconfig.build.json`)
}

const lint = async (...extras: string[]) => {
  exec('eslint', '--config', '.eslintrc.json', '--ignore-path', '.gitignore', '\'./**/*.ts\'', ...extras)
}

task('compile', series(...forAll(compile)))

task('test', async () => {
  exec('jest', '--config', './jest.conf.js', '--passWithNoTests', '--detectOpenHandles')
})

task('lint', series(
  ...forAll(validateTs),
  () => lint()
))

task('fmt', () => lint('--fix'))

task('start-demo', () => {
  exec('yarn', 'ts-node-dev', '-r', 'tsconfig-paths/register', 'example/run.ts')
})

task('clean', parallel(
  () => exec('yarn', 'tsc', '--build', '--clean'),
  ...forAll((name: string) => compile(name, '--clean')),
))
