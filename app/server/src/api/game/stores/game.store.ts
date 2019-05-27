import { IGameStore } from '../interfaces/IGameStore.interface';
import { Game } from '../models/domain/game.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbGame } from '../../../db/typeOrm/dbModels/game/game.entity';
import { StoreSaveResponse } from '../../../common/models/storeSaveResponse.model';
import { StoreFindResponse } from '../../../common/models/storeFindResponse.model';
import { StoreFindRequest } from '../../../common/models/storeFindRequest.model';
import { Injectable, NotImplementedException, Inject } from '@nestjs/common';
import { json } from 'body-parser';
// import { v4 as uuid } from 'uuid';
import { IGameStoreProvider } from '../game-providers';

@Injectable()
export class GameStore implements IGameStore {
  constructor(
    @InjectRepository(DbGame) private readonly store: Repository<DbGame>,
    @Inject('UUID') private readonly uuid: () => string,
  ) {}

  async find(request: StoreFindRequest): Promise<StoreFindResponse<Game>> {
    try {
      if (request.ids && request.ids.length > 0) {
        return this.findByIds(request);
      } else {
        const [dbGames, count] = await this.repoFind(
          request.pageOffset,
          request.pageSize,
        );
        const games = dbGames.map(this.mapDbGameToGame);
        return new StoreFindResponse<Game>({
          pageNumber: Math.ceil(request.pageOffset / request.pageSize) + 1,
          pageSize: games.length,
          totalRecords: count,
          values: games,
          moreRecords: request.pageOffset + request.pageSize < count,
        });
      }
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async findByIds(request: StoreFindRequest): Promise<StoreFindResponse<Game>> {
    try {
      const [dbGames, count] = await this.repoFindByIds(
        request.ids,
        request.pageOffset,
        request.pageSize,
      );
      const games = dbGames.map(this.mapDbGameToGame);
      const fetchedIds = games.map(game => game.id);
      const unfetchedIds = request.ids.filter(id => !fetchedIds.includes(id));
      return new StoreFindResponse<Game>({
        pageNumber: Math.ceil(request.pageOffset / request.pageSize) + 1,
        pageSize: games.length,
        totalRecords: count,
        values: games,
        unfetchedIds,
        moreRecords: request.pageOffset + request.pageSize < count,
      });
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async findOne(id: string): Promise<Game> {
    try {
      const dbGame = await this.store.findOne({
        id,
      });
      if (dbGame) {
        return new Game({
          id: dbGame.id,
          name: dbGame.name,
          description: dbGame.description,
        });
      } else {
        return null;
      }
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async create(games: Array<Game>): Promise<StoreSaveResponse<string>> {
    const dbGames = games.map(g => {
      return new DbGame({
        id: this.uuid(),
        name: g.name,
        description: g.description,
      });
    });
    try {
      const saveResult = await this.store.save(dbGames);
      return new StoreSaveResponse<string>({
        values: saveResult.map(result => result.id),
      });
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async update(games: Array<Game>): Promise<StoreSaveResponse<string>> {
    try {
      /**
       * TODO: find more efficient way to update games.
       * TODO: try using uuid as primary column rather than autogen seq id.
       */
      const updateableGames = await this.store.findByIds(games.map(g => g.id));
      const gameIdsToUpdate = updateableGames.map(dbGame => dbGame.id);
      const gamesToUpdate = games
        .filter(g => gameIdsToUpdate.includes(g.id))
        .map(g => {
          return new DbGame({
            id: g.id,
            name: g.name,
            description: g.description,
          });
        });
      const savedGames = await this.store.save(gamesToUpdate);

      return new StoreSaveResponse<string>({
        values: savedGames.map(savedGame => {
          return savedGame.id;
        }),
      });
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async delete(ids: Array<string>): Promise<StoreSaveResponse<string>> {
    try {
      /**
       * TODO: find more efficient way to update games.
       * TODO: try using uuid as primary column rather than autogen seq id.
       */
      const deleteableGames = await this.store.findByIds(ids);
      const deletedGames = await this.store.remove(deleteableGames);
      return new StoreSaveResponse<string>({
        values: deleteableGames.map(g => g.id),
      });
    } catch (err) {
      this.logAndThrow(err);
    }
  }

  async repoFindByIds(
    ids: Array<string>,
    pageOffset: number,
    pageSize: number,
  ): Promise<[DbGame[], number]> {
    return await this.store
      .createQueryBuilder()
      .select('game')
      .from(DbGame, 'game')
      .where('game.id IN (:...ids)', { ids })
      .skip(pageOffset)
      .take(pageSize)
      .getManyAndCount();
  }

  async repoFind(
    pageOffset: number,
    pageSize: number,
  ): Promise<[DbGame[], number]> {
    return await this.store
      .createQueryBuilder('game')
      .skip(pageOffset)
      .take(pageSize)
      .getManyAndCount();
  }

  mapGameToDbGame(game: Game): DbGame {
    return new DbGame({
      id: game.id ? game.id : this.uuid(),
      name: game.name,
      description: game.description,
    });
  }

  mapDbGameToGame(dbGame: DbGame): Game {
    return new Game({
      id: dbGame.id,
      name: dbGame.name,
      description: dbGame.description,
    });
  }

  // Temp Function
  private logAndThrow(err) {
    const l = console.log;
    l('GameStore: ' + err);
    throw err;
  }
}

export const gameStoreProvider: IGameStoreProvider = {
  provide: 'GAME_STORE',
  useClass: GameStore,
};
