import { GameStore } from './game.store';
import { MockGameStore } from '../test/gameTestUtils';
import { getMockGames } from '../test/data/';
import { Test } from '@nestjs/testing';
import each from 'jest-each';
import { StoreFindResponse } from '../../../common/models/storeFindResponse.model';
import { GetGamesRequest, GetGameRequest } from '../models/dtos/getGame.dto';
import { Game } from '../models/domain/game.model';
import { ServiceFindResponse } from '../../../common/models/serviceFindResponse.model';
import 'jest';
import { CreateGamesRequest, GameToCreate } from '../models/dtos';
import { ServiceModifyResponse } from '../../../common/models/serviceModifyResponse.model';
import { StoreSaveResponse } from '../../../common/models/storeSaveResponse.model';
import {
  UpdateGamesRequest,
  GameToUpdate,
} from '../models/dtos/updateGame.dto';
import { DeleteGamesRequest } from '../models/dtos/deleteGameDto.dto';
import { Repository } from 'typeorm';
import { DbGame } from '../../../db/typeOrm/dbModels/game/game.entity';
import { StoreFindRequest } from '../../../common/models/storeFindRequest.model';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('GameStore', () => {
  let gameStore: GameStore;
  let mockRepository: Repository<DbGame>;
  const mockGames: Array<Game> = getMockGames();
  const appDomain: string = process.env.APP_DOMAIN;
  const appPort: string = process.env.APP_PORT;
  const gameEndpoint: string = process.env.GAME_ENDPOINT;

  beforeAll(async () => {
    const mockGameRepoProvider = {
      provide: getRepositoryToken(DbGame),
      useClass: Repository,
    };

    const app = await Test.createTestingModule({
      providers: [GameStore, mockGameRepoProvider],
    }).compile();

    gameStore = app.get<GameStore>(GameStore);
    mockRepository = app.get<Repository<DbGame>>(getRepositoryToken(DbGame));
  });

  describe('find', async () => {
    const testCases = [
      [
        // request
        new StoreFindRequest({
          pageOffset: 0,
          pageSize: 5,
        }),
        // mock response
        [
          mockGames.slice(10, 15).map(g => new DbGame({
            id: g.id,
            name: g.name,
            description: g.description,
          })),
          mockGames.length,
        ],
        // expected
        new StoreFindResponse<Game>({
          pageSize: 5,
          pageNumber: 1,
          values: mockGames.slice(10, 15),
          moreRecords: true,
          totalRecords: mockGames.length,
        }),
      ],
      [
        // request
        new StoreFindRequest({
          pageOffset: 150,
          pageSize: 50,
        }),
        // mock response
        [
          mockGames.slice(150).map(g => new DbGame({
            id: g.id,
            name: g.name,
            description: g.description,
          })),
          mockGames.length,
        ],
        // expected
        new StoreFindResponse<Game>({
          pageSize: 36,
          pageNumber: 4,
          values: mockGames.slice(150),
          moreRecords: false,
          totalRecords: mockGames.length,
        }),
      ],
    ];

    each(testCases).it('should page correctly', async (
        request: StoreFindRequest,
        mockResponse: [DbGame[], number],
        expected: StoreFindResponse<Game>,
      ) => {
        // arrange
        jest
          .spyOn(gameStore, 'repoFind')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameStore.find(request);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });

  describe('findByIds', async () => {
    const testCases = [
      [
        // request
        new StoreFindRequest({
          ids: [...mockGames.slice(50, 65).map(g => g.id)],
          pageSize: 100,
          pageOffset: 0,
        }),
        // mock response
        [
          [...mockGames.slice(50, 65).map(g => new DbGame({
            id: g.id,
            name: g.name,
            description: g.description,
          }))],
          15,
        ],
        // expected
        new StoreFindResponse<Game>({
          pageSize: 15,
          pageNumber: 1,
          values: mockGames.slice(50, 65),
          unfetchedIds: [],
          moreRecords: false,
          totalRecords: 15,
        }),
      ],
    ];

    each(testCases).it('should retrieve correct records', async (
        request: StoreFindRequest,
        mockResponse: [DbGame[], number],
        expected: StoreFindResponse<Game>,
    ) => {
      // arrange
      jest
        .spyOn(gameStore, 'repoFindByIds')
        .mockImplementation(() => mockResponse);

      // act
      const result = await gameStore.find(request);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', async () => {
    const testCases = [
      [
        // request
        mockGames[55].id,
        // mock response
        new DbGame({
          id: mockGames[55].id,
          name: mockGames[55].name,
          description: mockGames[55].description,
        }),
        // expected
        new DbGame({...mockGames[55]}),
      ],
      [
        // request
        '41b61362-4531-4d20-8ebb-974fc59175ec',
        // mock response
        null,
        // expected
        null,
      ],
    ];

    each(testCases).it('should return correct record', async (
      request: string,
      mockResponse: DbGame,
      expected: Game,
    ) => {
      // arrange
      jest
        .spyOn(mockRepository, 'findOne')
        .mockImplementation(() => mockResponse);

      // act
      const result = await gameStore.findOne(request);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('create', async () => {
    const testCases = [
      [
        mockGames.slice(50, 82),
        mockGames.slice(50, 82).map(g => new DbGame({...g})),
        new StoreSaveResponse<string>({
          values: mockGames.slice(50, 82).map(g => g.id),
        }),
      ],
    ];

    each(testCases).it('should create record', async (
      games: Array<Game>,
      mockResponse: Array<DbGame>,
      expected: StoreSaveResponse<string>,
    ) => {
      // arrange
      jest
        .spyOn(mockRepository, 'save')
        .mockImplementation(() => mockResponse);

      // act
      const result = await gameStore.create(games);

      // assert
      expect(result).toEqual(expected);
    });
  });

  describe('update', async () => {
    const testCases = [];

    each(testCases).it('should update the record', async (
      games: Array<Game>,
      mockResponse: Array<DbGame>,
      expected: StoreSaveResponse<string>,
    ) => {

    });
  });
});
