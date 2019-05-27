import { GameService } from './game.service';
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
import { IGameStoreProvider } from '../game-providers';

describe('GameService', () => {
  let gameService: GameService;
  let mockGameStore: MockGameStore;
  const mockGames: Array<Game> = getMockGames();
  const appDomain: string = process.env.APP_DOMAIN;
  const appPort: string = process.env.APP_PORT;
  const gameEndpoint: string = process.env.GAME_ENDPOINT;

  beforeAll(async () => {
    const mockGameStoreProvider: IGameStoreProvider = {
      provide: 'GAME_STORE',
      useClass: MockGameStore,
    };

    const app = await Test.createTestingModule({
      providers: [GameService, mockGameStoreProvider],
    }).compile();

    gameService = app.get<GameService>(GameService);
    mockGameStore = app.get<MockGameStore>('GAME_STORE');
  });

  describe('find', () => {
    const testCases = [
      [
        // request
        new GetGamesRequest({
          pageSize: 10,
          pageOffset: 10,
        }),
        // mock response
        new StoreFindResponse<Game>({
          pageSize: 10,
          pageNumber: 11,
          values: mockGames.slice(100, 110),
          unfetchedIds: [],
          moreRecords: true,
          totalRecords: mockGames.length,
        }),
        // expected
        new ServiceFindResponse<Game>({
          pageSize: 10,
          pageNumber: 11,
          values: mockGames.slice(100, 110),
          unfetchedIds: [],
          moreRecords: true,
          totalRecords: mockGames.length,
        }),
      ],
      [
        // request
        new GetGamesRequest({
          pageSize: 40,
          pageOffset: 160,
        }),
        // mock response
        new StoreFindResponse<Game>({
          pageSize: 26,
          pageNumber: 5,
          values: mockGames.slice(160),
          unfetchedIds: [],
          moreRecords: false,
          totalRecords: mockGames.length,
        }),
        // expected
        new ServiceFindResponse<Game>({
          pageSize: 26,
          pageNumber: 5,
          values: mockGames.slice(160),
          unfetchedIds: [],
          moreRecords: false,
          totalRecords: mockGames.length,
        }),
      ],
    ];

    each(testCases).it(
      'should page correctly',
      async (
        request: GetGamesRequest,
        mockResponse: StoreFindResponse<Game>,
        expected: ServiceFindResponse<Game>,
      ) => {
        // arrange
        jest
          .spyOn(mockGameStore, 'find')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameService.find(request);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });

  describe('findOne', () => {
    const testCases = [
      [
        // request
        new GetGameRequest({
          id: mockGames[55].id,
        }),
        // mock response
        mockGames[55],
        // expected
        mockGames[55],
      ],
      [
        // request
        new GetGameRequest({
          id: mockGames[160].id,
        }),
        // mock response
        mockGames[160],
        // expected
        mockGames[160],
      ],
      [
        // request
        new GetGameRequest({
          id: '11FAKE11-1ID1-4111-1NOT-1REAL1111111',
        }),
        // mock response
        null,
        // expected
        null,
      ],
    ];

    each(testCases).it(
      'should find correct record',
      async (request: GetGameRequest, mockResponse: Game, expected: Game) => {
        // arrange
        jest
          .spyOn(mockGameStore, 'findOne')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameService.findOne(request.id);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });

  describe('create', () => {
    const testCases = [
      [
        // request
        new CreateGamesRequest({
          gamesToCreate: [
            new GameToCreate({
              name: 'Fancy Rolls For Fun',
              description: 'The fanciest of rolls - for fun of course',
            }),
            new GameToCreate({
              name: 'Sweet Rolls',
              description: 'Oh So Yum',
            }),
            new GameToCreate({
              name: 'Best Rolls',
              description: 'Nothing Better',
            }),
          ],
        }),
        // mock response
        new StoreSaveResponse<string>({
          values: [
            '7f5f6ce4-d950-4f30-8d36-5d994c7a37a0',
            'd7ac7c4a-4fe1-4f7a-9a74-564a3ca9424a',
            '602c7d61-7d4b-4a21-a312-3de9eda63164',
          ],
        }),
        // expected
        new ServiceModifyResponse({
          ids: [
            '7f5f6ce4-d950-4f30-8d36-5d994c7a37a0',
            'd7ac7c4a-4fe1-4f7a-9a74-564a3ca9424a',
            '602c7d61-7d4b-4a21-a312-3de9eda63164',
          ],
        }),
      ],
    ];

    each(testCases).it(
      'should create records',
      async (
        request: CreateGamesRequest,
        mockResponse: StoreSaveResponse<string>,
        expected: ServiceModifyResponse,
      ) => {
        // arrange
        jest
          .spyOn(mockGameStore, 'create')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameService.create(request);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });

  describe('update', () => {
    const testCases = [
      [
        // request
        new UpdateGamesRequest({
          gamesToUpdate: [
            new GameToUpdate({
              id: '32d071cd-6a26-4c53-a00c-6a42d4350574',
              name: 'NEW NAME',
              description: 'NEW DESCRIPTION',
            }),
            new GameToUpdate({
              id: 'effeb722-ca9d-42d4-9b26-e2272297ab4e',
              name: 'NEW NAME',
            }),
            new GameToUpdate({
              id: 'eea9850a-7346-43ae-8333-462b614451dc',
              description: 'NEW DESCRIPTION',
            }),
          ],
        }),
        // mock response
        new StoreSaveResponse<string>({
          values: [
            '32d071cd-6a26-4c53-a00c-6a42d4350574',
            'effeb722-ca9d-42d4-9b26-e2272297ab4e',
            'eea9850a-7346-43ae-8333-462b614451dc',
          ],
        }),
        // expected
        new ServiceModifyResponse({
          ids: [
            '32d071cd-6a26-4c53-a00c-6a42d4350574',
            'effeb722-ca9d-42d4-9b26-e2272297ab4e',
            'eea9850a-7346-43ae-8333-462b614451dc',
          ],
        }),
      ],
    ];

    each(testCases).it(
      'should update records',
      async (
        request: UpdateGamesRequest,
        mockResponse: StoreSaveResponse<string>,
        expected: ServiceModifyResponse,
      ) => {
        // arrange
        jest
          .spyOn(mockGameStore, 'update')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameService.update(request);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });

  describe('delete', () => {
    const testCases = [
      [
        // request
        new DeleteGamesRequest({
          ids: [
            '7d3502a2-d551-45ec-a2ea-4ab5812bd832',
            '2701182b-cbe9-418f-84e3-c8a730d55e5b',
            '295e9316-cc98-4898-8d19-da90de70a475',
          ],
        }),
        // mock response
        new StoreSaveResponse<string>({
          values: [
            '7d3502a2-d551-45ec-a2ea-4ab5812bd832',
            '2701182b-cbe9-418f-84e3-c8a730d55e5b',
            '295e9316-cc98-4898-8d19-da90de70a475',
          ],
        }),
        // expected
        new ServiceModifyResponse({
          ids: [
            '7d3502a2-d551-45ec-a2ea-4ab5812bd832',
            '2701182b-cbe9-418f-84e3-c8a730d55e5b',
            '295e9316-cc98-4898-8d19-da90de70a475',
          ],
        }),
      ],
    ];

    each(testCases).it(
      'should delete records',
      async (
        request: DeleteGamesRequest,
        mockResponse: StoreSaveResponse<string>,
        expected: ServiceModifyResponse,
      ) => {
        // arrange
        jest
          .spyOn(mockGameStore, 'delete')
          .mockImplementation(() => mockResponse);

        // act
        const result = await gameService.delete(request);

        // assert
        expect(result).toEqual(expected);
      },
    );
  });
});
